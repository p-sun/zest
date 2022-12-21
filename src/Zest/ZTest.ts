import { Vec3 } from '../HorizonShim/HZShim'

/* -------------------------------------------------------------------------- */
/*                                  ZTest.ts                                  */
/* -------------------------------------------------------------------------- */

export function CreateZTestsStore(): ZTestsStore {
  return new ZTestsStoreImpl()
}

export type ZEventName = string

export type ZTestStatus =
  | { done: false; passStatus: 'RUNNING' | 'FAIL' | 'INVALID' }
  | { done: true; passStatus: 'PASS' | 'FAIL' | 'INVALID' | 'CANCEL' }

export class ZTestResult {
  constructor(
    readonly testName: string,
    readonly testId: string,
    readonly status: ZTestStatus,
    readonly text: string
  ) {}
}

export interface ZTestsStore {
  startTest(testName: string): ZTest
  getTest(testName: string): ZTest | undefined

  setCurrentTest(testName: string): ZTest | undefined
  getCurrentTest(): ZTest | undefined

  finishFrame(): ZTestResult | null

  getTestResult(testName: string): ZTestResult | undefined
  addCurrentResultListener(
    updateResult: (testResult: ZTestResult) => void
  ): void
  addResultListener(
    updateResult: (testResult: ZTestResult, isCurrentTest: boolean) => void
  ): void
}

export interface ZTest {
  readonly testId: string

  expectEvent(eventName: ZEventName): void
  startEvent(eventName: string): void

  appendData(str1: string, str2?: string, str3?: string): void
  appendDataKeyValue(key: string, value: string): void

  expectEqual(key: string, actual: string, expected: string): void
  expectNotEqual(key: string, actual: string, expected: string): void

  expectNotEmpty(key: string, value: string | number | Vec3): void
  warnNotEmpty(key: string, value: string | number | Vec3): void

  finishFrame(): ZTestResult | null

  cancelTest(): void
  finishTest(): ZTestResult
  finishTestWithDelay(
    seconds: number,
    setTimeoutFn: (callback: () => void, timeout?: number) => number
  ): void

  getTestResult(): ZTestResult
  addResultListener(updateResult: (testResult: ZTestResult) => void): void
}

/* -------------------------------------------------------------------------- */
/*                             Private Zest Utils                             */
/* -------------------------------------------------------------------------- */

type TestName = string
type TestNamePlusKey = string

const delimitor = '###'

function SplitTestNamePlusKey(
  testNamePlusKey: TestNamePlusKey,
  sourceFunction: string
):
  | {
      testName: TestName
      key: string
    }
  | undefined {
  const [testName, key] = testNamePlusKey.split(delimitor)
  if (key && key !== '') {
    return { testName, key }
  }
  console.log(
    `Error: ${sourceFunction} event expected first param to have '###'. i.e. 'testName###key'. Got: '${testNamePlusKey}'`
  )
}

function JoinTestNamePlusKey(testName: TestName, key: string): TestNamePlusKey {
  return testName + delimitor + key
}

/* -------------------------------------------------------------------------- */
/*                              ZTestStoreImpl.ts                             */
/* -------------------------------------------------------------------------- */

type CurrentTestData = {
  testName: string
  testId: string
}

type ZTestStoreListener = (
  testResult: ZTestResult,
  isCurrentTest: boolean
) => void

export class ZTestsStoreImpl implements ZTestsStore {
  private tests: { [testName: string]: ZTest } = {}
  private currentTestData?: CurrentTestData
  private resultListeners: ZTestStoreListener[] = []
  private currentResultListeners: ((testResult: ZTestResult) => void)[] = []

  /* ---------------------------- Choose Which Test --------------------------- */

  startTest(testName: string): ZTest {
    this.tests[testName]?.cancelTest()

    const test = new ZTestImpl(testName)
    test.addResultListener((testResult) => {
      this.updateResultListeners(testResult)
    })
    this.tests[testName] = test
    if (!this.currentTestData) {
      this.currentTestData = { testName, testId: test.testId }
    }

    return test
  }

  getTest(testName: string): ZTest | undefined {
    return this.tests[testName]
  }

  setCurrentTest(testName: string): ZTest | undefined {
    const test = this.getTest(testName)
    if (test) {
      this.currentTestData = { testName, testId: test.testId }
      return test
    } else {
      console.log(
        `ERROR: setCurrentTest called on non-existant test: ${testName}`
      )
    }
  }

  getCurrentTest(): ZTest | undefined {
    const testName = this.currentTestData?.testName
    return testName ? this.tests[testName] : undefined
  }

  /* -------------------------------- Lifecycle ------------------------------- */

  finishFrame(): ZTestResult | null {
    let currentResult: ZTestResult | null = null
    for (const [testName, test] of Object.entries(this.tests)) {
      const testResult = test.finishFrame()
      if (testResult && testResult.testId === this.currentTestData?.testId) {
        currentResult = testResult
      }
    }
    return currentResult
  }

  /* ------------------------------ Test Results ------------------------------ */

  getTestResult(testName: string): ZTestResult | undefined {
    return this.tests[testName].getTestResult()
  }

  addCurrentResultListener(updateResult: (testResult: ZTestResult) => void) {
    this.currentResultListeners.push(updateResult)
  }

  addResultListener(updateResult: ZTestStoreListener) {
    this.resultListeners.push(updateResult)
  }

  private updateResultListeners(testResult: ZTestResult) {
    const isCurrentTest = this.currentTestData?.testId === testResult.testId

    for (const updateResult of this.resultListeners) {
      updateResult(testResult, isCurrentTest)
    }
    if (isCurrentTest) {
      for (const updateResult of this.currentResultListeners) {
        updateResult(testResult)
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                ZTestImpl.ts                                */
/* -------------------------------------------------------------------------- */

type LineColor = 'default' | 'red' | 'green' | 'yellow' | 'grey'

function WrapTextWithHorizonColorTags(text: string, color: LineColor) {
  if (!text) {
    return ''
  }
  switch (color) {
    case 'red':
      return `<color=#f66>${text}</color>`
    case 'green':
      return `<color=#6f6>${text}</color>`
    case 'yellow':
      return `<color=#ff0>${text}</color>`
    case 'grey':
      return `<color=#ccc>${text}</color>`
    case 'default':
      return text
  }
}

type Frame = number

type Line = { text: string; color: LineColor }

export class ZTestImpl implements ZTest {
  readonly testId: string
  private needsUpdate = true
  private isCancelled = false
  private currentFrame = 0
  private instructionsMgr: InstructionsManager
  private resultListeners: ((testResult: ZTestResult) => void)[] = []

  constructor(testName: string) {
    this.testId = String(Math.random()) + Math.random()
    this.instructionsMgr = new InstructionsManager(testName)
    this.instructionsMgr.push({
      functionName: 'startTest',
      testName,
      frame: this.currentFrame,
    })
  }

  /* --------------------------- Event Expectations --------------------------- */

  expectEvent(eventName: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectEvent',
      eventName,
      frame: this.currentFrame,
    })
  }

  startEvent(eventName: ZEventName) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'startEvent',
      eventName,
      frame: this.currentFrame,
    })
  }

  /* ------------------------------- Append Data ------------------------------ */

  appendData(str1: string, str2?: string, str3?: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'appendData',
      str1,
      str2,
      str3,
      frame: this.currentFrame,
    })
  }

  appendDataKeyValue(key: string, value: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'appendDataKeyValue',
      key,
      value,
      frame: this.currentFrame,
    })
  }

  /* --------------------------- Value Expectations --------------------------- */

  expectEqual(key: string, value: string, expectedVal: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectEqual',
      key,
      value,
      expectedVal,
      isWarn: false,
      frame: this.currentFrame,
    })
  }

  expectNotEqual(key: string, value: string, expectedVal: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectNotEqual',
      key,
      value,
      expectedVal,
      isWarn: false,
      frame: this.currentFrame,
    })
  }

  expectNotEmpty(key: string, value: string | number | Vec3) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectNotEmpty',
      key,
      value,
      frame: this.currentFrame,
      isWarn: false,
    })
  }

  warnNotEmpty(key: string, value: string | number | Vec3) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectNotEmpty',
      key,
      value,
      isWarn: true,
      frame: this.currentFrame,
    })
  }

  /* ---------------------------- Public Lifecycle ---------------------------- */

  cancelTest() {
    this.isCancelled = true
    this.instructionsMgr.push({
      functionName: 'cancelTest',
      frame: this.currentFrame,
    })
  }

  finishTest(): ZTestResult {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'finishTest',
      frame: this.currentFrame,
    })

    return this.sendResultToListeners()
  }

  finishTestWithDelay(
    seconds: number,
    setTimeoutFn: (callback: () => void, timeout?: number) => number
  ) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'finishTestWithDelay',
      seconds,
      frame: this.currentFrame,
    })

    setTimeoutFn(() => {
      if (!this.isCancelled) {
        this.needsUpdate = true
        this.instructionsMgr.push({
          functionName: 'finishTestWithDelayCallback',
          seconds,
          frame: this.currentFrame,
        })
        this.sendResultToListeners()
      }
    }, seconds * 1000)
  }

  finishFrame(): ZTestResult | null {
    this.currentFrame++
    if (this.needsUpdate) {
      return this.sendResultToListeners()
    }
    return null
  }

  /* ----------------------------- Get Test Result ---------------------------- */

  getTestResult(): ZTestResult {
    const { text, status } = this.instructionsMgr.getHorizonString()
    return new ZTestResult(
      this.instructionsMgr.testName,
      this.testId,
      status,
      text
    )
  }

  addResultListener(updateResult: (testResult: ZTestResult) => void) {
    this.needsUpdate = true
    this.resultListeners.push(updateResult)
  }

  private sendResultToListeners(): ZTestResult {
    const results = this.getTestResult()
    this.needsUpdate = false

    for (const listener of this.resultListeners) {
      listener(results)
    }
    return results
  }
}

type HasFrame = { frame: Frame }

type Instruction = HasFrame &
  (
    | {
        functionName: 'startTest'
        testName: string
      }
    | {
        functionName: 'finishTest'
      }
    | {
        functionName: 'finishTestWithDelay'
        seconds: number
      }
    | {
        functionName: 'finishTestWithDelayCallback'
        seconds: number
      }
    | {
        functionName: 'cancelTest'
      }
    | {
        functionName: 'expectEvent'
        eventName: ZEventName
      }
    | {
        functionName: 'startEvent'
        eventName: ZEventName
      }
    | {
        functionName: 'appendDataKeyValue'
        key: string
        value: string
      }
    | {
        functionName: 'appendData'
        str1: string
        str2?: string
        str3?: string
      }
    | {
        functionName: 'expectEqual'
        key: string
        value: string
        expectedVal: string
        isWarn: boolean
      }
    | {
        functionName: 'expectNotEqual'
        key: string
        value: string
        expectedVal: string
        isWarn: boolean
      }
    | {
        functionName: 'expectNotEmpty'
        key: string
        value: string | number | Vec3
        isWarn: boolean
      }
  )

type InstructionsAcc = {
  status: ZTestStatus
  expectEventOnceInstrs: (Instruction & {
    functionName: 'expectEvent'
  })[]
}
class InstructionsManager {
  private instructions: Instruction[] = []

  constructor(public readonly testName: string) {}

  getHorizonString(): { text: string; status: ZTestStatus } {
    let str = ''
    let isFirstStr = true
    let currentColor: LineColor = 'default'
    let strForCurrentColor = ''

    const { lines, status } = InstructionsManager.parseLinesForInstructions(
      this.instructions
    )

    for (const line of lines) {
      const text = (isFirstStr ? '' : '<br>') + line.text
      isFirstStr = false

      if (currentColor === line.color) {
        strForCurrentColor += text
      } else {
        str += WrapTextWithHorizonColorTags(strForCurrentColor, currentColor)
        strForCurrentColor = text
        currentColor = line.color
      }
    }

    str += WrapTextWithHorizonColorTags(strForCurrentColor, currentColor)
    return { text: str, status: status }
  }

  /* ---------------------------- Public Lifecycle ---------------------------- */

  push(instruction: Instruction) {
    this.instructions.push(instruction)
  }

  /* ------------------------------ Parse Results ----------------------------- */

  private static parseLinesForInstructions(instructions: Instruction[]): {
    lines: Line[]
    status: ZTestStatus
  } {
    let currentFrame: Frame = -1
    let accumulator: InstructionsAcc = {
      status: { done: false, passStatus: 'RUNNING' },
      expectEventOnceInstrs: [],
    }

    let lines: Line[] = []
    for (const instr of instructions) {
      if (currentFrame !== instr.frame) {
        currentFrame = instr.frame
        const maybeBreak = currentFrame !== 0 ? '<br>' : ''
        lines.push({
          text: `${maybeBreak}--- FRAME ${currentFrame} ---`,
          color: 'grey',
        })
      }

      lines = lines.concat(
        Array.from(this.parseLinesForInstruction(instr, accumulator))
      )
    }

    const textStatus = 'TEST STATUS: ' + accumulator.status.passStatus + '<br>'
    const testStatusLine: Line = {
      text: textStatus,
      color:
        accumulator.status.passStatus === 'PASS'
          ? 'green'
          : accumulator.status.passStatus === 'FAIL'
          ? 'red'
          : 'grey',
    }

    lines.unshift(testStatusLine)

    return { lines, status: accumulator.status }
  }

  private static *parseLinesForInstruction(
    instr: Instruction,
    acc: InstructionsAcc
  ): Generator<Line, void, unknown> {
    switch (instr.functionName) {
      case 'startTest':
        yield {
          text: `${instr.functionName}("${instr.testName}")`,
          color: 'default',
        }
        break

      case 'expectEvent':
        yield {
          text: `${instr.functionName}("${instr.eventName}")`,
          color: 'default',
        }

        acc.expectEventOnceInstrs.push(instr)
        break

      case 'startEvent':
        const expectOnce = acc.expectEventOnceInstrs.shift()
        if (expectOnce) {
          if (instr.eventName === expectOnce.eventName) {
            yield {
              text: `startEvent("${instr.eventName}")<br>| OK: ${expectOnce.functionName}("${expectOnce.eventName}")`,
              color: 'green',
            }
            break
          } else {
            yield {
              text: `startEvent("${instr.eventName}")<br>| EXPECT:  ${expectOnce.functionName}("${expectOnce.eventName}")`,
              color: 'red',
            }
            acc.status = { done: false, passStatus: 'FAIL' }
            break
          }
        }

        yield {
          text: `startEvent("${instr.eventName}")<br>| EXPECT: No startEvent()`,
          color: 'red',
        }
        acc.status = { done: false, passStatus: 'FAIL' }

        break

      case 'finishTestWithDelay':
        yield {
          text: `finishTestWithDelay(${instr.seconds})`,
          color: 'default',
        }
        break
      case 'finishTest':
      case 'finishTestWithDelayCallback':
        if (instr.functionName === 'finishTest') {
          yield {
            text: `finishTest()`,
            color: 'default',
          }
        } else {
          yield {
            text: `finishTestWithDelay(${instr.seconds}) --> Delay Done`,
            color: 'default',
          }
        }
        if (!acc.status.done && acc.expectEventOnceInstrs.length > 0) {
          yield {
            text: `<br>Finished with unfulfilled expects:`,
            color: 'grey',
          }
          for (const expect of acc.expectEventOnceInstrs) {
            yield {
              text:
                `${expect.functionName}("${expect.eventName}")<br>| ` +
                `GOT: No startEvent("${expect.eventName}")`,
              color: 'red',
            }
            acc.status = { done: true, passStatus: 'FAIL' }
          }
        } else {
          const finalStatus =
            acc.status.passStatus === 'RUNNING' ? 'PASS' : acc.status.passStatus
          acc.status = { done: true, passStatus: finalStatus }
        }
        break
      case 'cancelTest':
        yield {
          text: `cancelTest()`,
          color: 'default',
        }
        acc.status = { done: true, passStatus: 'CANCEL' }
        break
      case 'appendData':
        if (instr.str3) {
          yield {
            text: `appendData("${instr.str1}", "${instr.str2}", "${instr.str3}")`,
            color: 'default',
          }
        } else if (instr.str2) {
          yield {
            text: `appendData("${instr.str1}", "${instr.str2}")`,
            color: 'default',
          }
        } else {
          yield {
            text: `appendData("${instr.str1}")`,
            color: 'default',
          }
        }
        break

      case 'appendDataKeyValue':
        yield {
          text: `appendData("${instr.key}", "${instr.value}")`,
          color: 'default',
        }
        break

      case 'expectEqual':
      case 'expectNotEqual':
        const line = this._lineForEquality(instr)
        if (line.color === 'red') {
          acc.status = { done: false, passStatus: 'FAIL' }
        }
        yield line
        break

      case 'expectNotEmpty':
        {
          let isExpected = false
          if (typeof instr.value === 'number') {
            isExpected = instr.value !== 0
          } else if (typeof instr.value === 'string') {
            isExpected = instr.value !== '' && instr.value !== '0'
          } else if (instr.value instanceof Vec3) {
            isExpected = !instr.value.equals(Vec3.zero)
          }
          yield this._lineForIsExpected(
            isExpected,
            instr.isWarn,
            `${instr.functionName}("${instr.key}", value)`
          )
          if (!isExpected) {
            acc.status = { done: false, passStatus: 'FAIL' }
          }
        }
        break

      default:
        throw new Error(
          'Instruction Parser not implemented' + JSON.stringify(instr)
        )
    }
  }

  static _lineForEquality(
    instr: Instruction &
      ({ functionName: 'expectEqual' } | { functionName: 'expectNotEqual' })
  ) {
    const isExpected =
      instr.functionName === 'expectEqual'
        ? instr.value === instr.expectedVal
        : instr.value !== instr.expectedVal
    const valueIsStr = typeof instr.value === 'string'
    const valueStr = valueIsStr ? `"${instr.value}"` : `${instr.value}`
    const expValStr = valueIsStr
      ? `"${instr.expectedVal}"`
      : `${instr.expectedVal}`

    return this._lineForIsExpected(
      isExpected,
      instr.isWarn,
      `${instr.functionName}("${instr.key}", ${valueStr}, ${expValStr})`
    )
  }

  static _lineForIsExpected(
    isExpected: boolean,
    isWarn: boolean,
    text: string
  ): Line {
    const color = isExpected ? 'green' : isWarn ? 'yellow' : 'red'
    const status = isExpected ? 'OK' : isWarn ? 'WARN' : 'FAIL'
    return {
      text: `${text} | ${status}`,
      color,
    }
  }
}

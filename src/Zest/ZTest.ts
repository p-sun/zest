import { Vec3 } from '../HorizonShim/HZShim'

/* -------------------------------------------------------------------------- */
/*                                  ZTest.ts                                  */
/* -------------------------------------------------------------------------- */

export function CreateZTestsStore(): ZTestsStore {
  return new ZTestsStoreImpl()
}

export type ZEventName = string

export type ZTestStatus =
  | { done: false; passStatus: 'RUNNING' | 'FAIL' | 'WARN' }
  | { done: true; passStatus: 'PASS' | 'FAIL' | 'WARN' | 'INVALID' | 'CANCEL' }

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

  // Warning are post-fixed with 'W',
  // so that this API matches the codeblocks API
  expectEvent(eventName: ZEventName): void
  expectEventW(eventName: ZEventName): void

  detectEvent(eventName: string): void
  detectEventW(eventName: string): void

  appendData(str1: string, str2?: string): void

  expectEqual(key: string, actual: string, expected: string): void
  expectNotEqual(key: string, actual: string, expected: string): void

  expectNotEmpty(key: string, value: string | number | Vec3): void
  expectNotEmptyW(key: string, value: string | number | Vec3): void

  finishFrame(): ZTestResult | null

  finishTest(): ZTestResult
  finishTestWithDelay(
    seconds: number,
    setTimeoutFn: (callback: () => void, timeout?: number) => number
  ): void

  cancelTest(): void
  invalidateTest(message?: string): void

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
    if (testName.length === 0) {
      console.log(
        `ERROR in ZTestsStore: startTest must have a testName. Received: ${testName}`
      )
    }
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
    if (testResult.testName.length === 0) {
      console.log(
        'ERROR in ZTestsStoreImpl: Got no testName. Test Result: ',
        testResult.testName,
        testResult.testId
      )
    }
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
      return `<color=#ff3>${text}</color>`
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
      isWarn: false,
    })
  }

  expectEventW(eventName: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectEventW',
      eventName,
      frame: this.currentFrame,
      isWarn: true,
    })
  }

  detectEvent(eventName: ZEventName) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'detectEvent',
      eventName,
      frame: this.currentFrame,
      isWarn: false,
    })
  }

  detectEventW(eventName: ZEventName) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'detectEventW',
      eventName,
      frame: this.currentFrame,
      isWarn: true,
    })
  }

  /* ------------------------------- Append Data ------------------------------ */

  appendData(str1: string, str2?: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'appendData',
      str1,
      str2: str2,
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

  expectNotEmptyW(key: string, value: string | number | Vec3) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'expectNotEmptyW',
      key,
      value,
      frame: this.currentFrame,
      isWarn: true,
    })
  }

  /* ---------------------------- Public Lifecycle ---------------------------- */

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

  cancelTest() {
    this.isCancelled = true
    this.instructionsMgr.push({
      functionName: 'cancelTest',
      frame: this.currentFrame,
    })
  }

  invalidateTest(message: string = '') {
    this.isCancelled = true
    this.instructionsMgr.push({
      functionName: 'invalidateTest',
      message,
      frame: this.currentFrame,
    })
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
        functionName: 'invalidateTest'
        message: string
      }
    | {
        functionName: 'expectEvent'
        eventName: ZEventName
        isWarn: false
      }
    | {
        functionName: 'expectEventW'
        eventName: ZEventName
        isWarn: true
      }
    | {
        functionName: 'detectEvent'
        eventName: ZEventName
        isWarn: false
      }
    | {
        functionName: 'detectEventW'
        eventName: ZEventName
        isWarn: true
      }
    | {
        functionName: 'appendData'
        str1: string
        str2?: string
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
        isWarn: false
      }
    | {
        functionName: 'expectNotEmptyW'
        key: string
        value: string | number | Vec3
        isWarn: true
      }
  )

type InstructionsAcc = {
  status: ZTestStatus
  detectedIndicies: Set<number>
}

type ExpectEventInstruction = Instruction & {
  functionName: 'expectEvent' | 'expectEventW'
  index: number
}

type InstructionWithIndex = Instruction & {
  index: number
}

class InstructionsManager {
  private instructions: Instruction[] = []

  constructor(public readonly testName: string) {}

  /* ---------------------------- Public Lifecycle ---------------------------- */

  push(instruction: Instruction) {
    this.instructions.push(instruction)
  }

  getHorizonString(): { text: string; status: ZTestStatus } {
    let str = ''
    let prevLine: Line = null as any
    let prevLineCount = 1

    const { lines, status } = InstructionsManager.parseLinesForInstructions(
      this.instructions
    )

    lines.forEach((line, i) => {
      const isLineSameAsPrev =
        prevLine && prevLine.text === line.text && prevLine.color === line.color
      if (!prevLine) {
        prevLine = line
      } else if (isLineSameAsPrev) {
        prevLineCount++
      } else {
        const openingBreak =
          i === 0 || prevLine.text.endsWith('<br>') ? '' : '<br>'
        if (prevLineCount > 1) {
          str += WrapTextWithHorizonColorTags(
            openingBreak + `Repeated ${prevLineCount}x:`,
            'grey'
          )
        }

        //const endBreak = prevLineCount > 1 && !line.text.startsWith('<br>') ? '<br>' : ''
        const text = '<br>' + prevLine.text // + endBreak
        str += WrapTextWithHorizonColorTags(text, prevLine.color)
        prevLine = line
        prevLineCount = 1
      }
    })

    if (prevLineCount > 1) {
      str +=
        '<br>' +
        WrapTextWithHorizonColorTags(`Repeated ${prevLineCount}x:`, 'grey')
    }
    str += '<br>' + WrapTextWithHorizonColorTags(prevLine.text, prevLine.color)
    return { text: str, status: status }
  }

  /* ------------------------------ Parse Results ----------------------------- */

  private static parseLinesForInstructions(instructions: Instruction[]): {
    lines: Line[]
    status: ZTestStatus
  } {
    let currentFrame: Frame = -1
    let accumulator: InstructionsAcc = {
      status: { done: false, passStatus: 'RUNNING' },
      detectedIndicies: new Set<number>(),
    }

    const instructionsWithIndex = instructions.map((instr, index) => {
      return { ...instr, index, wasProcessed: false }
    })

    const expectedEvents = instructionsWithIndex.filter(
      (instr) =>
        instr.functionName === 'expectEvent' ||
        instr.functionName === 'expectEventW'
    ) as ExpectEventInstruction[]

    let lines: Line[] = []
    instructionsWithIndex.forEach((instr) => {
      if (currentFrame !== instr.frame) {
        currentFrame = instr.frame
        const maybeBreak = currentFrame !== 0 ? '<br>' : ''
        lines.push({
          text: `${maybeBreak}--- FRAME ${currentFrame} ---`,
          color: 'grey',
        })
      }

      lines = lines.concat(
        Array.from(
          this.parseLinesForInstruction(instr, expectedEvents, accumulator)
        )
      )
    })

    const textStatus = 'TEST STATUS: ' + accumulator.status.passStatus + '<br>'
    const testStatusLine: Line = {
      text: textStatus,
      color:
        accumulator.status.passStatus === 'PASS'
          ? 'green'
          : accumulator.status.passStatus === 'FAIL'
          ? 'red'
          : accumulator.status.passStatus === 'WARN'
          ? 'yellow'
          : 'grey',
    }

    lines.unshift(testStatusLine)

    return { lines, status: accumulator.status }
  }

  private static *parseLinesForInstruction(
    instr: InstructionWithIndex,
    expectEventInstrs: ExpectEventInstruction[],
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
      case 'expectEventW':
        yield {
          text: `${instr.functionName}("${instr.eventName}")`,
          color: 'default',
        }
        break

      case 'detectEvent':
      case 'detectEventW':
        const { success, message } = this._evaluateDetectEvent(
          instr,
          acc.detectedIndicies,
          expectEventInstrs
        )
        if (success) {
          yield {
            text:
              `${instr.functionName}("${instr.eventName}")` +
              `<br>| OK: ${message})`,
            color: 'green',
          }
        } else {
          const { color, passStatus } = this._colorStatusForFailedLine(
            instr.isWarn
          )
          yield {
            text:
              `${instr.functionName}("${instr.eventName}")` +
              `<br>| ${passStatus}: ${message}`,
            color,
          }

          acc.status = this._newStatusForFailedLine(
            false,
            instr.isWarn,
            acc.status
          )
        }
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
        const undetectedExpects = expectEventInstrs.filter((instr) => {
          return !acc.detectedIndicies.has(instr.index)
        })
        if (!acc.status.done && undetectedExpects.length > 0) {
          yield {
            text: `<br>Still waiting on detectEvent():`,
            color: 'grey',
          }
          for (const expect of undetectedExpects) {
            const { color, passStatus: passStatus } =
              this._colorStatusForFailedLine(expect.isWarn)
            yield {
              text:
                `${expect.functionName}("${expect.eventName}")` +
                `<br>| ${passStatus}: Waiting on detectEvent("${expect.eventName}")`,
              color,
            }

            acc.status = this._newStatusForFailedLine(
              true,
              expect.isWarn,
              acc.status
            )
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
      case 'invalidateTest':
        const msg = `"${instr.message}"`
        yield {
          text: `invalidateTest(${instr.message !== '' ? msg : ''})`,
          color: 'default',
        }
        acc.status = { done: true, passStatus: 'INVALID' }
        break
      case 'appendData':
        if (instr.str2 !== undefined) {
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

      case 'expectEqual':
      case 'expectNotEqual':
        const line = this._lineForEquality(instr)
        if (line.color === 'red') {
          acc.status = { done: false, passStatus: 'FAIL' }
        }
        yield line
        break

      case 'expectNotEmpty':
      case 'expectNotEmptyW':
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
            `${instr.functionName}("${instr.key}", value)`,
            instr.isWarn
          )
          if (!isExpected) {
            acc.status = this._newStatusForFailedLine(
              false,
              instr.isWarn,
              acc.status
            )
          }
        }
        break

      default:
        throw new Error(
          'Instruction Parser not implemented' + JSON.stringify(instr)
        )
    }
  }

  /*
    ^ means expectEvent was detected by a previous detectEvent().
    * is current expectEvent
  
    Expect A B, Detect A B         -> success: true
           ^ *
    Expect A B, Detect B A         -> success: false, msg: "A is expected before B". Finish test: Not waiting.
           * ^          
    Expect A B, Detect B A A       -> success: false, msg: "No expectEvent("A") before detectEvent()". Finish test: Not waiting.
           ^ ^          
    Expect A B C D, Detect B D A   -> success: false, msg: "A is expected before B". Finish test: Waiting on C.
           * ^   ^ 
    Expect A B C D E, Detect B E C -> success: false, msg: "C is expected before E". Finish test: Waiting on A & D.
             ^ *   ^ 
  */
  static _evaluateDetectEvent(
    detectEvent: InstructionWithIndex & {
      functionName: 'detectEvent' | 'detectEventW'
    },
    detectedIndicies: Set<number>,
    expectEventInstrs: ExpectEventInstruction[] // All expectations before and after detectEvent
  ): {
    success: boolean
    message: string
  } {
    const undetectedExp = expectEventInstrs.find((instr) => {
      return (
        instr.eventName == detectEvent.eventName &&
        !detectedIndicies.has(instr.index)
      )
    })
    if (!undetectedExp || detectEvent.index < undetectedExp.index) {
      // SEARCH 1: Does the next undetected expectation with same eventName
      // as detectEvent(), occur AFTER detectEvent()? (bad case)
      return {
        success: false,
        message: `No expectEvent("${detectEvent.eventName}") before detectEvent().`,
      }
    }

    detectedIndicies.add(undetectedExp.index)
    const nextFulfilledExpectation = expectEventInstrs.find((instr) => {
      return (
        detectedIndicies.has(instr.index) && undetectedExp.index < instr.index
      )
    })

    if (nextFulfilledExpectation) {
      // SEARCH 2: Given the undetectedExp is BEFORE detectEvent(), is there another
      // expectation that has been detected AFTER the current undetectedExp? (Bad case)
      return {
        success: false,
        message: `"${detectEvent.eventName}" is expected before "${nextFulfilledExpectation.eventName}"`,
      }
    }

    return {
      success: true,
      message: `${undetectedExp.functionName}("${undetectedExp.eventName}"`,
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
      `${instr.functionName}("${instr.key}", ${valueStr}, ${expValStr})`,
      instr.isWarn
    )
  }

  // Given the status for a single line and current status, return the new status
  static _newStatusForFailedLine(
    lineIsDone: boolean,
    lineIsWarn: boolean,
    currentStatus: ZTestStatus
  ): ZTestStatus {
    const { done: cDone, passStatus: cStatus } = currentStatus
    const done = cDone || lineIsDone
    const isWarn = lineIsWarn && (cStatus === 'RUNNING' || cStatus === 'WARN')
    let passStatus: ZTestStatus['passStatus'] = isWarn ? 'WARN' : 'FAIL'
    return { done, passStatus }
  }

  static _lineForIsExpected(
    isExpected: boolean,
    text: string,
    isWarn: boolean
  ): Line {
    const { color, passStatus } = this._colorStatus(isExpected, isWarn)
    return { text: `${text} | ${passStatus}`, color }
  }

  static _colorStatus(
    isExpected: boolean,
    isWarn: boolean
  ): { passStatus: ZTestStatus['passStatus']; color: LineColor } {
    if (isExpected) {
      return { color: 'green', passStatus: 'PASS' }
    }
    return this._colorStatusForFailedLine(isWarn)
  }

  static _colorStatusForFailedLine(isWarn: boolean): {
    passStatus: 'WARN' | 'FAIL'
    color: LineColor
  } {
    return {
      color: isWarn ? 'yellow' : 'red',
      passStatus: isWarn ? 'WARN' : 'FAIL',
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                Horizon Utils                               */
/* -------------------------------------------------------------------------- */

function SplitIntoStringsWithMaxLength(
  str: string,
  lineBreak: string,
  maxLength: number
) {
  if (str.length <= maxLength) {
    return [str]
  }

  let sections: string[] = []
  let currentSection: string = ''

  const lines = str.split(lineBreak)
  lines.forEach((line, i) => {
    if (currentSection.length + line.length > maxLength) {
      sections.push(currentSection)
      currentSection = line + lineBreak
    } else {
      const isLastLine = i === lines.length - 1
      currentSection += line + (isLastLine ? '' : lineBreak)
    }
  })

  sections.push(currentSection)
  return sections
}

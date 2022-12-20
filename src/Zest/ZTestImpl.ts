import { Vec3 } from '../HorizonShim/HZShim'
import { ZEventName, ZTest, ZTestResult, ZTestStatus } from './ZTest'

type LineColor = 'default' | 'red' | 'green' | 'yellow' | 'grey'

function WrapTextWithHorizonColorTags(text: string, color: LineColor) {
  if (!text) {
    return ''
  }
  switch (color) {
    case 'red':
      return `<color=#f88>${text}</color>`
    case 'green':
      return `<color=#8f8>${text}</color>`
    case 'yellow':
      return `<color=#ff0>${text}</color>`
    case 'grey':
      return `<color=#ccc>${text}</color>`
    case 'default':
      return text
  }
}

type Frame = number

type ZLine = { text: string; color: LineColor }

export default class ZTestImpl implements ZTest {
  readonly testId: string
  private needsUpdate: boolean = true
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

  finishTest(): ZTestResult {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'finishTest',
      frame: this.currentFrame,
    })

    return this.sendResultToListeners()
  }

  finishTestWithDelay(seconds: number) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'finishTestWithDelay',
      seconds,
      frame: this.currentFrame,
    })

    setTimeout(() => {
      this.needsUpdate = true
      this.instructionsMgr.push({
        functionName: 'finishTestWithDelayCallback',
        seconds,
        frame: this.currentFrame,
      })
      this.sendResultToListeners()
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

  addResultListener(updateResultsFn: (testResult: ZTestResult) => void) {
    this.needsUpdate = true
    this.resultListeners.push(updateResultsFn)
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
    lines: ZLine[]
    status: ZTestStatus
  } {
    let currentFrame: Frame = -1
    let accumulator: InstructionsAcc = {
      status: { done: false, passStatus: 'RUNNING' },
      expectEventOnceInstrs: [],
    }

    let lines: ZLine[] = []
    for (const instr of instructions) {
      if (currentFrame !== instr.frame) {
        currentFrame = instr.frame
        const maybeBreak = currentFrame !== 0 ? '<br>' : ''
        lines.push({
          text: `${maybeBreak}--- FRAME ${currentFrame} ---`,
          color: 'grey',
        })
      }

      lines = lines.concat([
        ...this.parseLinesForInstruction(instr, accumulator),
      ])
    }

    const textStatus = 'TEST STATUS: ' + accumulator.status.passStatus + '<br>'
    const testStatusLine: ZLine = {
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
  ): Generator<ZLine, void, unknown> {
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
              text: `startEvent("${instr.eventName}") | OK: ${expectOnce.functionName}("${expectOnce.eventName}")`,
              color: 'green',
            }
            break
          } else {
            yield {
              text: `startEvent("${instr.eventName}") | EXPECT:  ${expectOnce.functionName}("${expectOnce.eventName}")`,
              color: 'red',
            }
            acc.status = { done: false, passStatus: 'FAIL' }
            break
          }
        }

        yield {
          text: `startEvent("${instr.eventName}") | EXPECT: No startEvent()`,
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
        if (acc.expectEventOnceInstrs.length > 0) {
          yield {
            text: `.. UNFULFILLED EXPECTS:`,
            color: 'grey',
          }
          for (const expect of acc.expectEventOnceInstrs) {
            yield {
              text: `.... ${expect.functionName}("${expect.eventName}") | GOT: No startEvent()`,
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
  ): ZLine {
    const color = isExpected ? 'green' : isWarn ? 'yellow' : 'red'
    const status = isExpected ? 'OK' : isWarn ? 'WARN' : 'FAIL'
    return {
      text: `${text} | ${status}`,
      color,
    }
  }
}

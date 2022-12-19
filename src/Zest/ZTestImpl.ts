import { Vec3 } from '../HorizonShim/HZShim'
import ZTest, { EventName, ZTestResult } from './ZTest'
import { type } from 'os'

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

type TextLine = { text: string; color: LineColor }

export default class ZTestImpl implements ZTest {
  private needsUpdate: boolean = true
  private currentFrame = 0
  private instructionsMgr: InstructionsManager
  private resultsListeners: ((TestResult: ZTestResult) => void)[] = []

  constructor(tName: string) {
    this.instructionsMgr = new InstructionsManager(tName)
    this.instructionsMgr.push({
      functionName: 'startTest',
      testName: tName,
      frame: this.currentFrame,
    })
  }

  /* ----------------------------- Get Test Result ---------------------------- */

  testResult(): ZTestResult {
    return new ZTestResult(
      this.instructionsMgr.testName,
      this.instructionsMgr.getHorizonString()
    )
  }

  addResultListener(updateResultsFn: (TestResult: ZTestResult) => void) {
    this.resultsListeners.push(updateResultsFn)
    this.needsUpdate = true
  }

  /* --------------------------- Event Expectations --------------------------- */

  expectEvent(eventName: string) {
    this.instructionsMgr.push({
      functionName: 'expectEvent',
      eventName,
      frame: this.currentFrame,
    })
  }

  startEvent(eventName: EventName) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'startEvent',
      eventName,
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

  finishFrame(): ZTestResult | null {
    this.currentFrame++
    if (this.needsUpdate) {
      return this.sendResultToListeners()
    }
    return null
  }

  private sendResultToListeners(): ZTestResult {
    const results = this.testResult()
    this.needsUpdate = false

    for (const listener of this.resultsListeners) {
      listener(results)
    }
    return results
  }

  /* ------------------------------- Append Data ------------------------------ */

  appendData(key: string, value: string) {
    this.needsUpdate = true
    this.instructionsMgr.push({
      functionName: 'appendData',
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
        functionName: 'expectEvent'
        eventName: EventName
      }
    | {
        functionName: 'startEvent'
        eventName: EventName
      }
    | {
        functionName: 'appendData'
        key: string
        value: string
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
  expectEventOnceInstrs: (Instruction & {
    functionName: 'expectEvent'
  })[]
}
class InstructionsManager {
  private instructions: Instruction[] = []

  constructor(public readonly testName: string) {}

  getHorizonString(): string {
    let str = ''
    let isFirstStr = true
    let currentColor: LineColor = 'default'
    let strForCurrentColor = ''
    for (const textResult of InstructionsManager.parseTextResults(
      this.instructions
    )) {
      const text = (isFirstStr ? '' : '<br>') + textResult.text
      isFirstStr = false

      if (currentColor === textResult.color) {
        strForCurrentColor += text
      } else {
        str += WrapTextWithHorizonColorTags(strForCurrentColor, currentColor)

        strForCurrentColor = text
        currentColor = textResult.color
      }
    }

    str += WrapTextWithHorizonColorTags(strForCurrentColor, currentColor)
    return str
  }

  /* ---------------------------- Public Lifecycle ---------------------------- */

  push(instruction: Instruction) {
    this.instructions.push(instruction)
  }

  /* ------------------------------ Parse Results ----------------------------- */

  private static *parseTextResults(
    instructions: Instruction[]
  ): Generator<TextLine, void, unknown> {
    let currentFrame: Frame = -1
    let accumulator: InstructionsAcc = { expectEventOnceInstrs: [] }

    for (const instr of instructions) {
      if (currentFrame !== instr.frame) {
        currentFrame = instr.frame
        const maybeBreak = currentFrame !== 0 ? '<br>' : ''
        yield {
          text: `${maybeBreak}--- FRAME ${currentFrame} ---`,
          color: 'grey',
        }
      }

      for (const line of this.parseInstruction(instr, accumulator)) {
        yield line
      }
    }
  }

  private static *parseInstruction(
    instr: Instruction,
    acc: InstructionsAcc
  ): Generator<TextLine, void, unknown> {
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
            break
          }
        }

        yield {
          text: `startEvent("${instr.eventName}") | EXPECT: No startEvent()`,
          color: 'red',
        }
        break

      case 'finishTest':
        yield {
          text: `finishTest()`,
          color: 'default',
        }
        if (acc.expectEventOnceInstrs.length > 0) {
          yield {
            text: `.. UNFULFILLED EXPECTS:`,
            color: 'grey',
          }
        }
        for (const expect of acc.expectEventOnceInstrs) {
          yield {
            text: `.... ${expect.functionName}("${expect.eventName}") | GOT: No startEvent()`,
            color: 'red',
          }
        }
        break

      case 'appendData':
        yield {
          text: `${instr.key}: ${instr.value}`,
          color: 'default',
        }
        break

      case 'expectEqual':
        yield this._textLineForEquality(instr)
        break

      case 'expectNotEqual':
        yield this._textLineForEquality(instr)
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
          yield this._textLine(
            `${instr.functionName}("${instr.key}", value)`,
            isExpected,
            instr.isWarn
          )
        }
        break

      default:
        throw new Error(
          'Instruction Parser not implemented' + JSON.stringify(instr)
        )
    }
  }

  static _textLineForEquality(
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

    return this._textLine(
      `${instr.functionName}("${instr.key}", ${valueStr}, ${expValStr})`,
      isExpected,
      instr.isWarn
    )
  }

  static _textLine(
    text: string,
    isExpected: boolean,
    isWarn: boolean
  ): TextLine {
    const color = isExpected ? 'green' : isWarn ? 'yellow' : 'red'
    const status = isExpected ? 'OK' : isWarn ? 'WARN' : 'FAIL'
    return {
      text: `${text} | ${status}`,
      color,
    }
  }
}

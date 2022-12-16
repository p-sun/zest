import { Vec3 } from '../HorizonShim/HZShim'
import ZTest, { EventName, TestResult } from './ZTest'

type TextResultColor = 'default' | 'red' | 'green' | 'yellow' | 'grey'
function WrapTextWithHorizonColorTags(text: string, color: TextResultColor) {
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

type HasFrame = { frame: Frame }

type Instruction = HasFrame &
  (
    | {
        functionName: 'startTest'
      }
    | {
        functionName: 'finishTest'
      }
    | {
        functionName: 'expectEventOnce'
        eventName: EventName
      }
    | {
        functionName: 'startEvent'
        eventName: EventName
      }
  )

type Frame = number

type TextLine = { text: string; color: TextResultColor }

class ExpectationsManager {
  private instructions: Instruction[] = []
  readonly testName: string

  constructor(testName: string) {
    this.testName = testName
    this.instructions.push({
      functionName: 'startTest',
      frame: 0,
    })
  }

  getHorizonString(): string {
    let str = ''
    let isFirstStr = true
    let currentColor: TextResultColor = 'default'
    let strForCurrentColor = ''
    for (const textResult of this.parseTextResults()) {
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

  startEvent(eventName: EventName, frame: Frame) {
    this.instructions.push({
      functionName: 'startEvent',
      eventName,
      frame,
    })
  }

  finishTest(frame: Frame) {
    this.instructions.push({
      functionName: 'finishTest',
      frame,
    })
  }

  /* ------------------------------ Parse Results ----------------------------- */

  private textResultForFrame(frame: Frame): TextLine {
    let text = '--- FRAME ' + frame + ' ---'
    if (frame !== 0) {
      text = '<br>' + text
    }
    return { text, color: 'grey' }
  }

  private *parseTextResults(): Generator<TextLine, void, unknown> {
    let thisFrame: Frame = -1
    let expectOnceInstrs: (Instruction & {
      functionName: 'expectEventOnce'
    })[] = []

    for (const [i, instr] of this.instructions.entries()) {
      if (thisFrame !== instr.frame) {
        thisFrame = instr.frame
        yield this.textResultForFrame(instr.frame)
      }

      switch (instr.functionName) {
        case 'startTest':
          yield {
            text: `${instr.functionName}("${this.testName}")`,
            color: 'default',
          }
          break
        case 'expectEventOnce':
          yield {
            text: `${instr.functionName}("${instr.eventName}")`,
            color: 'default',
          }
          expectOnceInstrs.push(instr)
          break
        case 'startEvent':
          const expectOnce = expectOnceInstrs.shift()
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
          if (expectOnceInstrs.length > 0) {
            yield {
              text: `.. UNFULFILLED EXPECTS:`,
              color: 'grey',
            }
          }
          for (const expect of expectOnceInstrs) {
            yield {
              text: `.... ${expect.functionName}("${expect.eventName}") | GOT: No startEvent()`,
              color: 'red',
            }
          }
          break
        default:
          throw new Error(
            'Instruction Parser not implemented' + JSON.stringify(instr)
          )
      }
    }
  }
}

type ResultThisFrame = {
  appendStr: string
  needsUpdate: boolean
  expectEventNTimes: { [eventName: EventName]: number }
  timesEventsOccurred: { [eventName: EventName]: number }
}

export default class ZTestImpl implements ZTest {
  private needsFirstUpdate: boolean
  private needsUpdate: boolean = false

  private expectationMgr: ExpectationsManager

  private updateResultsFn: ((TestResult: TestResult) => void) | undefined
  private currentFrame = 0

  constructor(tName: string) {
    this.expectationMgr = new ExpectationsManager(tName)
    this.needsFirstUpdate = true
  }

  addResultListener(updateResultsFn: (TestResult: TestResult) => void) {
    this.updateResultsFn = updateResultsFn
  }

  get testResult(): TestResult {
    return new TestResult(
      this.expectationMgr.testName,
      this.expectationMgr.getHorizonString()
    )
  }

  /* ---------------------------- Public Lifecycle ---------------------------- */

  startEvent(eventName: EventName) {
    this.needsUpdate = true
    this.expectationMgr.startEvent(eventName, this.currentFrame)
  }

  appendData(key: string, value: string) {
    this.needsUpdate = true
  }

  finishTest(): TestResult {
    this.needsUpdate = true
    this.expectationMgr.finishTest(this.currentFrame)
    const results = this.testResult
    this.updateResultsFn?.(results)
    return results
  }

  finishFrame(): TestResult | null {
    if (this.needsUpdate) {
      this.needsFirstUpdate = false

      this.currentFrame++
      const results = this.testResult
      this.updateResultsFn?.(results)
      return results

      // If no data was logged last frame, only display the Start Test String
    } else if (this.needsFirstUpdate) {
      this.needsFirstUpdate = false

      this.currentFrame++
      const results = this.testResult
      this.updateResultsFn?.(results)
      return results
    }

    this.currentFrame++
    return null
  }

  /* --------------------------- Event Expectations --------------------------- */

  expectEventOnce(eventName: string) {
    this.expectationMgr.push({
      functionName: 'expectEventOnce',
      eventName,
      frame: this.currentFrame,
    })
  }

  /* --------------------------- Value Expectations --------------------------- */

  warnNotZero(key: string, n: number) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorWarnNotZero({
    //   isExpected: n != 0,
    //   key: key,
    //   actualStr: String(n),
    //   expectedStr: 'not 0',
    // })
  }

  expectNotZero(key: string, n: number) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorExpectationsNotZero({
    //   isExpected: n != 0,
    //   key: key,
    //   actualStr: String(n),
    //   expectedStr: 'not 0',
    // })
  }

  warnNotZeroVec3(key: string, vec3: Vec3) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorWarnNotZero({
    //   isExpected: !vec3.equals(Vec3.zero),
    //   key: key,
    //   actualStr: String(vec3),
    //   expectedStr: 'not Vec3(0, 0, 0)',
    // })
  }

  expectNotZeroVec3(key: string, vec3: Vec3) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorExpectationsNotZero({
    //   isExpected: !vec3.equals(Vec3.zero),
    //   key: key,
    //   actualStr: String(vec3),
    //   expectedStr: 'not Vec3(0, 0, 0)',
    // })
  }

  expectEqual(key: string, actual: string, expected: string) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorExpectationsNotEqual({
    //   isExpected: actual === expected,
    //   key: key,
    //   actualStr: actual,
    //   expectedStr: expected,
    // })
  }

  expectNotZeroOrEmpty(key: string, value: string) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorExpectationsNotZero({
    //   isExpected: value !== '' && value !== '0',
    //   key: key,
    //   actualStr: value,
    //   expectedStr: 'not 0 or empty',
    // })
  }

  warnNotZeroOrEmpty(key: string, value: string) {
    // this.thisFrame.needsUpdate = true
    // this.thisFrame.appendStr += this._colorExpectationsNotZero({
    //   isExpected: value !== '' && value !== '0',
    //   key: key,
    //   actualStr: value,
    //   expectedStr: 'not 0 or empty',
    // })
  }

  /* ------------------------------ Private Utils ----------------------------- */

  _createNewFrameResult(): ResultThisFrame {
    return {
      appendStr: '',
      needsUpdate: false,
      expectEventNTimes: {},
      timesEventsOccurred: {},
    }
  }

  _colorExpectationsNotZero(param: {
    isExpected: boolean
    key: string
    actualStr: string
    expectedStr: string
  }): string {
    let str: string = '<br>'

    if (param.isExpected) {
      str += '<color=#0f0>' // Green
      str += param.key + ' : ' + param.actualStr
    } else {
      str += '<color=#f00>' // Red
      str += 'EXPECTED ' + param.key + ' : ' + param.expectedStr
    }
    str += '</color>'
    return str
  }

  _colorWarnNotZero(param: {
    isExpected: boolean
    key: string
    actualStr: string
    expectedStr: string
  }): string {
    let str: string = '<br>'

    if (param.isExpected) {
      str += '<color=#0f0>' // Green
      str += param.key + ' : ' + param.actualStr
    } else {
      str += '<color=#ff0>' // Yellow
      str += 'WARN EXPECTED ' + param.key + ' : ' + param.expectedStr
    }
    str += '</color>'
    return str
  }

  _colorExpectationsNotEqual(param: {
    isExpected: boolean
    key: string
    actualStr: string
    expectedStr: string
  }): string {
    let str: string = '<br>'

    if (param.isExpected) {
      str += '<color=#0f0>' // Green
    } else {
      str += '<color=#f00>' // Red
      str += 'EXPECTED ' + param.key + ' : ' + param.expectedStr
      str += '<br>ACTUAL '
    }
    str += param.key + ' : ' + param.actualStr + '</color>'
    return str
  }

  _colorWarnNotEqual(param: {
    isExpected: boolean
    key: string
    actualStr: string
    expectedStr: string
  }): string {
    let str: string = '<br>'

    if (param.isExpected) {
      str += '<color=#0f0>' // Green
    } else {
      str += '<color=#ff0>' // Yellow
      str += 'WARN EXPECTED ' + param.key + ' : ' + param.expectedStr
      str += '<br>ACTUAL '
    }
    str += param.key + ' : ' + param.actualStr + '</color>'
    return str
  }
}

import { Vec3 } from '../HorizonShim/HZShim'
import IZTest, { EventName, TestResult } from './IZTest'

type ResultThisFrame = {
  appendStr: string
  needsUpdate: boolean
  expectEventNTimes: { [eventName: EventName]: number }
  timesEventsOccurred: { [eventName: EventName]: number }
}

export function createZestTest(testName: string): IZTest {
  return new ZTest(testName)
}

export default class ZTest implements IZTest {
  private thisFrame: ResultThisFrame
  private result: TestResult
  private needsFirstUpdate: boolean
  private updateResultsFn: ((testResult: TestResult) => void) | undefined

  constructor(tName: string) {
    this.result = new TestResult(tName)
    this.thisFrame = this._createNewFrameResult()
    this.needsFirstUpdate = true
  }

  listenToResults(updateResultsFn: (testResult: TestResult) => void) {
    this.updateResultsFn = updateResultsFn
  }

  get testResult(): TestResult {
    return this.result.clone()
  }

  // Public Lifecycle ---------
  startEvent(eventName: EventName) {
    // this._expectEventToOccurOnceIfNeeded(eventName)

    // Events Changed
    this.thisFrame.needsUpdate = true
    const timesOccurred = this.thisFrame.timesEventsOccurred[eventName] ?? 0
    this.thisFrame.timesEventsOccurred[eventName] = timesOccurred + 1

    // Event Logging
    this.thisFrame.appendStr += '<br><br>START EVENT: [' + eventName + ']'
  }

  appendData(key: string, value: string) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr =
      this.thisFrame.appendStr + '<br>' + key + ' : ' + value
  }

  finishFrame(): TestResult | null {
    if (this.thisFrame.needsUpdate) {
      // Expectations for how many times an event should occur in a single frame
      let onceAFrameEventsStr = ''
      for (const [eventName, expectedOccurance] of Object.entries(
        this.thisFrame.expectEventNTimes
      )) {
        const actualOccurance =
          this.thisFrame.timesEventsOccurred[eventName] ?? 0
        onceAFrameEventsStr += this._colorExpectationsNotEqual({
          isExpected: actualOccurance == expectedOccurance,
          key: 'COUNT [' + eventName + ']',
          actualStr: String(actualOccurance),
          expectedStr: String(expectedOccurance),
        })
      }

      if (!this.result.firstFrameStr) {
        // First Frame
        this.result.firstFrameStr = 'FIRST FRAME --------'
        this.result.firstFrameStr +=
          onceAFrameEventsStr + this.thisFrame.appendStr
      } else {
        // Most Recent frame
        this.result.lastFrameStr = '<align=left>MOST RECENT FRAME --------'
        this.result.lastFrameStr +=
          onceAFrameEventsStr + this.thisFrame.appendStr
      }

      this.thisFrame.needsUpdate = false
      this.thisFrame = this._createNewFrameResult()

      this.needsFirstUpdate = false

      const results = this.testResult
      this.updateResultsFn?.(results)
      return results

      // If no data was logged last frame, only display the Start Test String
    } else if (this.needsFirstUpdate) {
      this.needsFirstUpdate = false
      const results = this.testResult
      this.updateResultsFn?.(results)
      return results
    }

    return null
  }

  // Expects --------------

  warnNotZero(key: string, n: number) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorWarnNotZero({
      isExpected: n != 0,
      key: key,
      actualStr: String(n),
      expectedStr: 'not 0',
    })
  }

  expectNotZero(key: string, n: number) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorExpectationsNotZero({
      isExpected: n != 0,
      key: key,
      actualStr: String(n),
      expectedStr: 'not 0',
    })
  }

  warnNotZeroVec3(key: string, vec3: Vec3) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorWarnNotZero({
      isExpected: !vec3.equals(Vec3.zero),
      key: key,
      actualStr: String(vec3),
      expectedStr: 'not Vec3(0, 0, 0)',
    })
  }

  expectNotZeroVec3(key: string, vec3: Vec3) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorExpectationsNotZero({
      isExpected: !vec3.equals(Vec3.zero),
      key: key,
      actualStr: String(vec3),
      expectedStr: 'not Vec3(0, 0, 0)',
    })
  }

  expectEqual(key: string, actual: string, expected: string) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorExpectationsNotEqual({
      isExpected: actual === expected,
      key: key,
      actualStr: actual,
      expectedStr: expected,
    })
  }

  expectNotZeroOrEmpty(key: string, value: string) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorExpectationsNotZero({
      isExpected: value !== '' && value !== '0',
      key: key,
      actualStr: value,
      expectedStr: 'not 0 or empty',
    })
  }

  warnNotZeroOrEmpty(key: string, value: string) {
    this.thisFrame.needsUpdate = true
    this.thisFrame.appendStr += this._colorExpectationsNotZero({
      isExpected: value !== '' && value !== '0',
      key: key,
      actualStr: value,
      expectedStr: 'not 0 or empty',
    })
  }

  expectEvent(eventName: string) {
    this.thisFrame.expectEventNTimes[eventName] = 1
  }

  expectEventNTimes(eventName: EventName, n: number) {
    if (this.thisFrame.expectEventNTimes[eventName] != n) {
      this.thisFrame.expectEventNTimes[eventName] = n
    }
  }

  // _expectEventToOccurOnceIfNeeded(eventName: EventName) {
  //   if (this.thisFrame.expectEventNTimes[eventName] === undefined) {
  //     this.thisFrame.expectEventNTimes[eventName] = 1
  //   }
  // }

  // Private Utils -----------
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

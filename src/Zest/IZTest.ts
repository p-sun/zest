import { Vec3 } from '../HorizonShim/HZShim'

export default interface IZTest {
  get testResult(): TestResult
  listenToResults: (updateResultsFn: (testResult: TestResult) => void) => void

  startEvent: (eventName: string) => void
  appendData: (key: string, value: string) => void
  finishFrame(): TestResult | null

  expectEvent: (eventName: EventName) => void
  expectEventNTimes: (eventName: EventName, n: number) => void

  expectNotZero: (key: string, n: number) => void
  warnNotZero: (key: string, n: number) => void

  expectNotZeroVec3: (key: string, vec3: Vec3) => void
  warnNotZeroVec3: (key: string, vec3: Vec3) => void

  expectNotZeroOrEmpty: (key: string, value: string) => void
  warnNotZeroOrEmpty: (key: string, value: string) => void

  expectEqual: (key: string, actual: string, expected: string) => void
}

export type EventName = string

export class TestResult {
  testName: string
  firstFrameStr?: string
  lastFrameStr?: string

  constructor(testName: string, firstFrameStr?: string, lastFrameStr?: string) {
    this.testName = testName
    this.firstFrameStr = firstFrameStr
    this.lastFrameStr = lastFrameStr
  }

  get text1Str() {
    return this.startTestStr + (this.firstFrameStr ?? '')
  }

  get text2Str() {
    return this.lastFrameStr ?? ''
  }

  get startTestStr() {
    return '<align=left>TEST [[' + this.testName + ']] ========<br><br>'
  }

  clone() {
    return new TestResult(this.testName, this.firstFrameStr, this.lastFrameStr)
  }
}

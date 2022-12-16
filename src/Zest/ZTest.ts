import { Vec3 } from '../HorizonShim/HZShim'
import ZTestImpl from './ZTestImpl'

export function createZestTest(testName: string): ZTest {
  return new ZTestImpl(testName)
}

export default interface ZTest {
  get testResult(): TestResult
  addResultListener: (updateResultsFn: (testResult: TestResult) => void) => void

  startEvent: (eventName: string) => void
  appendData: (key: string, value: string) => void
  finishFrame(): TestResult | null
  finishTest(): TestResult

  expectEventOnce: (eventName: EventName) => void

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
  constructor(public readonly testName: string, readonly text: string) {}

  clone() {
    return new TestResult(this.testName, this.text)
  }
}

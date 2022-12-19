import { Vec3 } from '../HorizonShim/HZShim'
import ZTestImpl from './ZTestImpl'

export function createZestTest(testName: string): ZTest {
  return new ZTestImpl(testName)
}

export default interface ZTest {
  addResultListener: (
    updateResultsFn: (testResult: ZTestResult) => void
  ) => void
  testResult(): ZTestResult

  startEvent: (eventName: string) => void
  expectEvent: (eventName: EventName) => void

  finishFrame(): ZTestResult | null
  finishTest(): ZTestResult

  appendData: (key: string, value: string) => void

  expectEqual: (key: string, actual: string, expected: string) => void
  expectNotEqual: (key: string, actual: string, expected: string) => void

  expectNotEmpty: (key: string, value: string | number | Vec3) => void
  warnNotEmpty: (key: string, value: string | number | Vec3) => void
}

export type EventName = string

export class ZTestResult {
  constructor(public readonly testName: string, readonly text: string) {}

  clone() {
    return new ZTestResult(this.testName, this.text)
  }
}

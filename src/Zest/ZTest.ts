import { Vec3 } from '../HorizonShim/HZShim'
import ZTestImpl from './ZTestImpl'

export function createZestTest(testName: string): ZTest {
  return new ZTestImpl(testName)
}

export default interface ZTest {
  readonly testId: string

  addResultListener: (
    updateResultsFn: (testResult: ZTestResult) => void
  ) => void
  testResult(): ZTestResult

  startEvent: (eventName: string) => void
  expectEvent: (eventName: EventName) => void

  finishFrame(): ZTestResult | null
  finishTest(): ZTestResult
  finishTestWithDelay: (seconds: number) => void

  logData: (key: string, value: string) => void

  expectEqual: (key: string, actual: string, expected: string) => void
  expectNotEqual: (key: string, actual: string, expected: string) => void

  expectNotEmpty: (key: string, value: string | number | Vec3) => void
  warnNotEmpty: (key: string, value: string | number | Vec3) => void
}

export type EventName = string

export type ZTestStatus = 'running' | 'pass' | 'fail' | 'invalid'
export class ZTestResult {
  constructor(
    readonly testName: string,
    readonly testId: string,
    readonly status: ZTestStatus,
    readonly text: string
  ) {}

  // clone() {
  //   return new ZTestResult(this.testName, this.testId, this.status, this.text)
  // }
}

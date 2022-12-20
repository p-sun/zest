import { Vec3 } from '../HorizonShim/HZShim'
import ZTestImpl from './ZTestImpl'
import ZTestsRunnerImpl from './ZTestsRunnerImpl'

export function CreateZTestsRunner(): ZTestsRunner {
  return new ZTestsRunnerImpl()
}

export function CreateZTest(testName: string): ZTest {
  return new ZTestImpl(testName)
}

export type ZEventName = string

export type ZTestStatus =
  | { done: false; passStatus: 'RUNNING' | 'FAIL' | 'INVALID' }
  | { done: true; passStatus: 'PASS' | 'FAIL' | 'INVALID' }

export class ZTestResult {
  constructor(
    readonly testName: string,
    readonly testId: string,
    readonly status: ZTestStatus,
    readonly text: string
  ) {}
}

export interface ZTestsRunner {
  startTest(testName: string): ZTest
  getTest(testName: string): ZTest | undefined

  setCurrentTest(testName: string): ZTest | undefined
  getCurrentTest(): ZTest | undefined

  finishFrame(): ZTestResult | null

  getTestResult(testName: string): ZTestResult | undefined
  addCurrentResultListener(
    updateResult: (testResult: ZTestResult) => void
  ): void
}

export interface ZTest {
  readonly testId: string

  expectEvent(eventName: ZEventName): void
  startEvent(eventName: string): void

  appendData(key: string, value: string): void

  expectEqual(key: string, actual: string, expected: string): void
  expectNotEqual(key: string, actual: string, expected: string): void

  expectNotEmpty(key: string, value: string | number | Vec3): void
  warnNotEmpty(key: string, value: string | number | Vec3): void

  finishFrame(): ZTestResult | null

  finishTest(): ZTestResult
  finishTestWithDelay(seconds: number): void

  getTestResult(): ZTestResult
  addResultListener(updateResultsFn: (testResult: ZTestResult) => void): void
}

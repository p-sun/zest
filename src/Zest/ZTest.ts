import { Vec3 } from '../HorizonShim/HZShim'
import { ZTestsStoreImpl } from './ZTestImpl'

export function CreateZTestsStore(): ZTestsStore {
  return new ZTestsStoreImpl()
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
}

export interface ZTest {
  readonly testId: string

  expectEvent(eventName: ZEventName): void
  startEvent(eventName: string): void

  appendData(str1: string, str2?: string, str3?: string): void
  appendDataKeyValue(key: string, value: string): void

  expectEqual(key: string, actual: string, expected: string): void
  expectNotEqual(key: string, actual: string, expected: string): void

  expectNotEmpty(key: string, value: string | number | Vec3): void
  warnNotEmpty(key: string, value: string | number | Vec3): void

  finishFrame(): ZTestResult | null

  finishTest(): ZTestResult
  finishTestWithDelay(seconds: number): void

  getTestResult(): ZTestResult
  addResultListener(updateResult: (testResult: ZTestResult) => void): void
}

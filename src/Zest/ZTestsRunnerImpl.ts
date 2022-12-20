import { CreateZTest, ZTest, ZTestResult, ZTestsRunner } from './ZTest'

type CurrentTestData = {
  testName: string
  testId: string
}

export default class ZTestsRunnerImpl implements ZTestsRunner {
  private tests: { [testName: string]: ZTest } = {}
  private currentTestData?: CurrentTestData
  private currentResultListeners: ((testResult: ZTestResult) => void)[] = []

  /* ---------------------------- Choose Which Test --------------------------- */

  startTest(testName: string): ZTest {
    const test = CreateZTest(testName)
    test.addResultListener((testResult) => {
      this.updateResultIfCurrentTest(testResult)
    })

    this.tests[testName] = test
    if (!this.currentTestData) {
      this.currentTestData = { testName, testId: test.testId }
    }

    return test
  }

  getTest(testName: string): ZTest | undefined {
    return this.tests[testName]
  }

  setCurrentTest(testName: string): ZTest | undefined {
    const test = this.getTest(testName)
    if (test) {
      this.currentTestData = { testName, testId: test.testId }
      return test
    } else {
      console.error(
        `ERROR: setCurrentTest called on non-existant test: ${testName}`
      )
    }
  }

  getCurrentTest(): ZTest | undefined {
    const testName = this.currentTestData?.testName
    return testName ? this.tests[testName] : undefined
  }

  /* -------------------------------- Lifecycle ------------------------------- */

  finishFrame(): ZTestResult | null {
    let currentResult: ZTestResult | null = null
    for (const [testName, test] of Object.entries(this.tests)) {
      const testResult = test.finishFrame()
      if (testResult && testResult.testId === this.currentTestData?.testId) {
        currentResult = testResult
      }
    }
    return currentResult
  }

  /* ------------------------------ Test Results ------------------------------ */

  getTestResult(testName: string): ZTestResult | undefined {
    return this.tests[testName].getTestResult()
  }

  addCurrentResultListener(updateResult: (testResult: ZTestResult) => void) {
    this.currentResultListeners.push(updateResult)
  }

  private updateResultIfCurrentTest(testResult: ZTestResult) {
    const currentTestId = this.currentTestData?.testId
    if (currentTestId === testResult.testId) {
      for (const updateResult of this.currentResultListeners) {
        updateResult(testResult)
      }
    }
  }
}

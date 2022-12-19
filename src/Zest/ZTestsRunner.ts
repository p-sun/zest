import ZTest, { createZestTest, ZTestResult } from './ZTest'

export class ZTestsRunner {
  private tests: { [testName: string]: ZTest } = {}
  private currentTestData:
    | {
        testName: string
        testId: string
      }
    | undefined

  /* ---------------------------- Choose Which Test --------------------------- */

  startTest(testName: string): ZTest {
    const test = createZestTest(testName)
    test.addResultListener((testResults) => {
      this.updateResultsForTest(testResults)
    })
    this.tests[testName] = test
    if (!this.getCurrentTest()) {
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

  /* ------------------------------ Test Results ------------------------------ */

  getTestResults(testName: string): ZTestResult | undefined {
    return this.tests[testName].testResult()
  }

  private updateResultsForTest(testResults: ZTestResult) {}

  /* -------------------------------- Lifecycle ------------------------------- */

  finishFrame(): ZTestResult | null {
    for (const [testName, test] of Object.entries(this.tests)) {
      const testResult = test.finishFrame()
      if (testResult && testResult.testId === this.currentTestData?.testId) {
        return testResult
      }
    }
    return null
  }
}

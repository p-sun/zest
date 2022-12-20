import ZTest, { createZestTest, ZTestResult } from './ZTest'

type CurrentTestData = {
  testName: string
  testId: string
}

export class ZTestsRunner {
  private tests: { [testName: string]: ZTest } = {}

  private currentTestData?: CurrentTestData

  private currentTestListeners: ((
    testName: string,
    testResult: ZTestResult
  ) => void)[] = []

  /* ---------------------------- Choose Which Test --------------------------- */

  startTest(testName: string): ZTest {
    const test = createZestTest(testName)
    const testData = { testName, testId: test.testId }
    this.tests[testName] = test

    if (!this.getCurrentTest()) {
      this.currentTestData = testData
    }

    test.addResultListener((testResults) => {
      this.updateResultForTest(testData, testResults)
    })

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

  getTestResult(testName: string): ZTestResult | undefined {
    return this.tests[testName].testResult()
  }

  addCurrentResultListener(
    updateResult: (testName: string, testResult: ZTestResult) => void
  ) {
    this.currentTestListeners.push(updateResult)
  }

  private updateResultForTest(
    testData: CurrentTestData,
    testResult: ZTestResult
  ) {
    if (testData.testId === testResult.testId) {
      for (const listener of this.currentTestListeners) {
        listener(testData.testName, testResult)
      }
    }
  }

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

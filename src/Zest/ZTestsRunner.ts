import ZTest, { createZestTest, ZTestResult } from './ZTest'

export class ZTestsRunner {
  private tests: { [testName: string]: ZTest } = {}
  private currentTestName?: string
  private needsUpdate = false

  startTest(testName: string) {
    this.tests[testName] = createZestTest(testName)

    if (this.currentTestName !== testName) {
      this.needsUpdate = true
      this.currentTestName = testName
    }
  }

  getTest(testName: string): ZTest | undefined {
    return this.tests[testName]
  }

  // getCurrentTest(): ZTest | undefined {
  //   return this.currentTestName ? this.tests[this.currentTestName] : undefined
  // }

  startEvent(testName: string, eventName: string) {
    this.tests[testName].startEvent(eventName)
  }

  getTestResults(testName: string): ZTestResult | undefined {
    return this.tests[testName].testResult()
  }

  finishFrame(updateResults: (result: ZTestResult) => void) {
    if (this.needsUpdate) {
      for (let [testName, test] of Object.entries(this.tests)) {
        const testResult = test.finishFrame()
        if (testResult && this.currentTestName === testName) {
          updateResults(Object.assign({}, testResult))
        }
      }
      this.needsUpdate = false
    }
  }
}

import ZTest, { createZestTest, TestResult } from './ZTest'

export class ZTestsRunner {
  tests: { [testName: string]: ZTest } = {}
  currentTestName?: string
  needsUpdate = false

  startTest(testName: string) {
    this.tests[testName] = createZestTest(testName)

    if (this.currentTestName !== testName) {
      this.needsUpdate = true
      this.currentTestName = testName
    }
  }

  startEvent(testName: string, eventName: string) {
    this.needsUpdate = true
    this.tests[testName]?.startEvent(eventName)
  }

  // getCurrentTest() : ZTest | undefined {
  //   return this.currentTestName ? this.tests[this.currentTestName] : undefined
  // }

  getTest(testName: string): ZTest | undefined {
    this.needsUpdate = true
    return this.tests[testName]
  }

  getTestResults(testName: string): TestResult | undefined {
    return this.tests[testName].testResult
  }

  finishFrame(updateResults: (result: TestResult) => void) {
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

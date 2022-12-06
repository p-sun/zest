import { displayTextOnHTML } from './HTMLShim/HTMLShim'
import IZTest, { TestResult } from './Zest/IZTest'
import { createZestTest } from './Zest/ZTest'
import { AllJestTestNames, JestConfigForName } from './Zest/tests/ZTestExamples'

const runHTMLTest = (jestTestName: AllJestTestNames) => {
  const zestTest: IZTest = createZestTest(jestTestName)
  const jestConfig = JestConfigForName(jestTestName)
  zestTest.listenToResults((testResult: TestResult) => {
    console.log(
      '****************************************\nTestResult: ',
      testResult
    )
    const describeStr = jestConfig.describe + ' > ' + jestConfig.it
    displayTextOnHTML(testResult, describeStr)
    console.log('****************************************')
  })
  jestConfig.runZestTest(zestTest, false)
}

const appRoot = document.getElementById('app')
if (appRoot) {
  runHTMLTest('testTwoEventsInOneFrame')
}

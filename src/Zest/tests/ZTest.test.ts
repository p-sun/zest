import ZTest, { createZestTest } from '../ZTest'
import { JestTestName, JestConfigForName } from './ZTestExamples'

const runJestTest = (testName: JestTestName) => {
  const config = JestConfigForName(testName)
  describe(config.describe, () => {
    it(config.it, () => {
      const zestTest: ZTest = createZestTest(testName)

      // let count = 0
      // zestTest.addResultListener((testResult: TestResult) => {
      //   // config.updateResultsFn(count++, testResult)
      // })
      config.runZestTest(zestTest, true)

      // const testResult = zestTest.finishFrame()
      // if (testResult) {
      //   expect(testResult.firstFrameStr).toBe(
      //     config.expectedTestResult.firstFrameStr
      //   )
      //   expect(testResult.lastFrameStr).toBe(
      //     config.expectedTestResult.lastFrameStr
      //   )
      // }
    })
  })
}

runJestTest('testTwoEventsInFrame0')

// Object.entries(allJestTests).forEach(([key, jestTestConfig]) => {
//   runJestTest(key, jestTestConfig)
// })

// describe('Test Zest', () => {
//   it('should', () => {
//     const test: ZTest = createZestTest('testOneEventInOneFrame')
//     test.startEvent('myEventA')
//     test.appendData('myKey1', 'myValue1')
//     test.finishFrame((testResult) => {
//       expect(testResult.startTestStr).toBe(
//         '<align=left>TEST [[testOneEventInOneFrame]] ========<br><br>'
//       )
//       expect(testResult.firstFrameStr).toBe(
//         'FIRST FRAME --------<br>' +
//           '<color=#0f0>COUNT [myEventA] : 1</color>' +
//           '<br><br>START EVENT: [myEventA]<br>myKey1 : myValue1'
//       )
//       //   console.log("****Test ", JSON.stringify(testResult))
//       //   displayTextOnHTML(testResult)
//     })
//     // const hello = true
//     // expect(hello).toBe(true)
//   })
// })

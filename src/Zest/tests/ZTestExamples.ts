import { Vec3 } from '../../HorizonShim/HZShim'
import IZTest, { TestResult } from '../IZTest'
import { TestsHolder } from '../TestsHolder'
import { createZestTest } from '../ZTest'

export type JestTestConfig = {
  describe: string
  it: string
  runZestTest: (test: IZTest, runJest: boolean) => void
}

export const allJestConfigs = {
  testTwoEventsInOneFrame: {
    describe: 'when two events occur in one frame',
    it: 'should fail ZTest',
    runZestTest: (test: IZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventA')

      const testResult = test.finishFrame()
      if (runJest) {
        expect(testResult).toMatchObject({
          testName: 'testTwoEventsInOneFra',
          firstFrameStr:
            'FIRST FRAME --------<br><color=#f00>EXPECTED COUNT [myEventA] : 1<br>ACTUAL COUNT [myEventA] : 2</color><br><br>START EVENT: [myEventA]<br><br>START EVENT: [myEventA]',
          lastFrameStr: undefined,
        })
      }
    },
  },
  testExpectThreeEventsToOccur: {
    describe: 'when',
    it: 'should',
    runZestTest: (test: IZTest, runJest: boolean) => {
      test.expectEventNTimes('myEventA', 3)
      test.startEvent('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventA')
    },
  },
  testExpectThreeEventsToOccur_MultiFrameFail: {
    describe: 'when',
    it: 'should',
    runZestTest: (test: IZTest, runJest: boolean) => {
      test.expectEventNTimes('myEventA', 3)
      test.startEvent('myEventA')
      test.appendData('myKey1', 'myValue1')
      test.startEvent('myEventA')
      test.appendData('myKey2', 'myValue2')

      test.finishFrame()

      test.startEvent('myEventA')
      test.appendData('myKey3', 'myValue3')
      test.startEvent('myEventA')
      test.appendData('myKey4', 'myValue4')
      test.startEvent('myEventA')
      test.appendData('myKey5', 'myValue5')

      test.finishFrame()
    },
    expectedTestResult: {
      firstFrameStr: '',
      lastFrameStr: undefined,
    },
  },
  template: {
    describe: 'when',
    it: 'should',
    runZestTest: (test: IZTest, runJest: boolean) => {},
  },
}

const AllJestTestsTypeChecker: { [key: string]: JestTestConfig } =
  allJestConfigs

export type AllJestTestNames = keyof typeof allJestConfigs
export const JestConfigForName = (name: AllJestTestNames) =>
  allJestConfigs[name]

function testExpectThreeEventsToOccur_MultiFrameFail() {
  const test: IZTest = createZestTest('testExpectThreeEventsToOccur_Success')
  test.expectEventNTimes('myEventA', 3)
  test.startEvent('myEventA')
  test.appendData('myKey1', 'myValue1')
  test.startEvent('myEventA')
  test.appendData('myKey2', 'myValue2')

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })

  test.startEvent('myEventA')
  test.appendData('myKey3', 'myValue3')
  test.startEvent('myEventA')
  test.appendData('myKey4', 'myValue4')
  test.startEvent('myEventA')
  test.appendData('myKey5', 'myValue5')

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testOneEventInOneFrame() {
  const test: IZTest = createZestTest('testOneEventInOneFrame')
  test.startEvent('myEventA')
  test.appendData('myKey1', 'myValue1')
  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testExpectStringEquality() {
  const test: IZTest = createZestTest('testExpectStringEquality')
  test.startEvent('myEventAA')

  test.expectEqual('myKey', 'myStringAA', 'myStringAA')
  test.expectEqual('myKey', 'myActualStringBB', 'myExpectedStringBB')

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testExpectNonZeroEquality_MultiFrame() {
  const test: IZTest = createZestTest('testExpectNonZeroEquality_MultiFrame')
  test.startEvent('myEventAA')

  test.expectNotZeroOrEmpty('notZeroKey', 'notZeroStr')
  test.expectNotZeroOrEmpty('zeroStrKey', '0')
  test.expectNotZeroOrEmpty('emptyStrKey', '')
  test.warnNotZeroOrEmpty('notZeroKey', 'notZeroStr')
  test.warnNotZeroOrEmpty('zeroStrKey', '0')
  test.warnNotZeroOrEmpty('emptyStrKey', '')

  test.expectNotZeroVec3('notZeroVecKey', new Vec3(8, 2, 1))
  test.expectNotZeroVec3('zeroVecKey', Vec3.zero)
  test.warnNotZeroVec3('notZeroVecKey', new Vec3(8, 2, 1))
  test.warnNotZeroVec3('zeroVecKey', Vec3.zero)

  test.expectNotZero('notZeroNumKey', 99)
  test.expectNotZero('zeroNumKey', 0)
  test.warnNotZero('notZeroVecKey', 99)
  test.warnNotZero('zeroNumKey', 0)

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })

  test.expectNotZero('notZeroNumKey', 99)
  test.expectNotZero('zeroNumKey', 0)
  test.warnNotZero('notZeroVecKey', 99)
  test.warnNotZero('zeroNumKey', 0)

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testNewTestWithDataAppendsOnly() {
  let library = new TestsHolder()
  const testA = 'NewTestA'
  library.startTest(testA)

  library.getTest(testA)?.appendData('keyA', 'valueA')
  library.getTest(testA)?.appendData('keyB', 'valueB')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })

  library.getTest(testA)?.appendData('keyC', 'valueC')
  library.getTest(testA)?.appendData('keyD', 'valueD')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })
}

function testNewMultiTests_WithDataAppendsOnly() {
  let library = new TestsHolder()
  const testA = 'NewTestA'
  const testB = 'NewTestB'

  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testB)?.appendData('keyAAA', 'valueBBB')
  library.getTest(testA)?.appendData('keyA', 'valueA')
  library.getTest(testA)?.appendData('keyB', 'valueB')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })

  library.getTest(testA)?.appendData('keyC', 'valueC')
  library.getTest(testB)?.appendData('keyCCC', 'valueCCC')
  library.getTest(testA)?.appendData('keyD', 'valueD')
  library.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })
}

function testNewMultiTests_TestBHasOnlyOneFrame() {
  let library = new TestsHolder()
  const testA = 'NewTestA'
  const testB = 'NewTestB'

  // Most recent 'startTest()' decides the current test
  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testA)?.appendData('keyA', 'valueA')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })

  // testB only has one event, so it only displays FIRST FRAME
  library.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  library.getTest(testA)?.appendData('keyD', 'valueD')
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })

  // Finishing another frame doesn't change testA and testB results
  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })

  // Display results from any previous test
  // // displayTextOnHTML(library.getTestResults(testA)!)
  // // displayTextOnHTML(library.getTestResults(testB)!)
}

function testEmptyStartTest() {
  let library = new TestsHolder()
  const test = 'NewEmptyTest'
  library.startTest(test)

  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })
}

function testGetResultsAfterEmptyStartTest() {
  let library = new TestsHolder()
  const test = 'testGetResultsAfterEmptyStartTest'
  library.startTest(test)

  let firstFrameResults: TestResult | undefined

  library.finishFrame((result) => {
    firstFrameResults = result
    // displayTextOnHTML(result)
  })

  const resultFromGetter = library.getTest(test)?.testResult
  if (resultFromGetter?.firstFrameStr != firstFrameResults?.firstFrameStr) {
    console.error('EXPECTED : ' + (firstFrameResults?.firstFrameStr ?? ''))
    console.error('BUT GOT : ' + (resultFromGetter?.firstFrameStr ?? ''))
  }
  if (resultFromGetter) {
    // displayTextOnHTML(resultFromGetter)
  }
}

// HTML HELPERS --------------------------

// RUN TESTS ----------------------------------
// testOneEventInOneFrame()
// testTwoEventsInOneFrame()
// testTwoEventsInOneFrame_WithData()

// testExpectThreeEventsToOccur()
// testExpectThreeEventsToOccur_MultiFrameFail()
// testExpectStringEquality()
// testExpectNonZeroEquality_MultiFrame()

// testNewTestWithDataAppendsOnly()
// testNewMultiTests_WithDataAppendsOnly()
// testNewMultiTests_TestBHasOnlyOneFrame()

// testEmptyStartTest()
// testGetResultsAfterEmptyStartTest()

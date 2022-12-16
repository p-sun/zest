import { Vec3 } from '../../HorizonShim/HZShim'
import ZTest, { createZestTest, TestResult } from '../ZTest'
import { ZTestsRunner } from '../ZTestsRunner'

export type JestTestConfig = {
  describe: string
  it: string
  runZestTest: (test: ZTest, runJest: boolean) => void
}

export const allJestConfigs = {
  testExpectEvent_3startEvent_noExpects: {
    describe: 'when receiving 3 events, with no expectations',
    it: 'should fail 3 events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.startEvent('myEventA')
      test.startEvent('myEventB')
      test.startEvent('myEventC')
      test.finishFrame()
    },
  },

  testExpectEvent_3expects_noStartEvents: {
    describe: 'when receiving 3 events, with no expectations',
    it: 'should fail 3 events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.expectEventOnce('myEventC')

      test.finishTest()
    },
  },

  testExpectEvent_expectAB_gotEventAB: {
    describe: 'when expecting event A-B, and recieving event A-B',
    it: 'should pass both events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishTest()
    },
  },

  testExpectEvent_expectAA_gotEventAA: {
    describe: 'when expecting event A-B, and recieving event A-B',
    it: 'should pass both events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventA')

      test.finishTest()
    },
  },

  testExpectEvent_expectAB_gotEventCD: {
    describe: 'when expecting event A-B, and recieving event C-D',
    it: 'should pass events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.startEvent('myEventC')
      test.startEvent('myEventD')

      test.finishTest()
    },
  },

  testExpectEvent_expectBeforeStartEvent: {
    describe: 'when expecting 1 event, but get 2 in one frame',
    it: 'should fail when second event is received',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishFrame()
    },
  },

  testExpectEvent_expectBeforeStartEvent_newFrame: {
    describe: 'when expectEvent is on frame 0, and startEvent on frame 2 & 3',
    it: 'should fail both startEvents on frame 2 & 3',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.finishFrame() // Finish frame 1

      test.finishFrame() // Finish frame 2

      test.startEvent('myEventA')
      test.finishFrame() // Finish frame 3

      test.startEvent('myEventB')
      test.finishFrame()
    },
  },

  testExpectEvent_expectAfterStartEvent: {
    describe: 'when expectEvent is after 2 startEvents',
    it: 'should fail both startEvents',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.startEvent('myEventA')
      test.startEvent('myEventB')
      test.expectEventOnce('myEventA')
      test.finishFrame()
    },
  },

  testExpectEvent_finishTest_newFrame: {
    describe: 'when finishTest is called with unfinished expects on frame 3',
    it: 'should fail expectations on frame 3',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.finishFrame() // finish frame 0
      test.finishFrame() // finish frame 1
      test.finishFrame() // finish frame 2

      test.finishTest() // on frame 3
    },
  },

  testExpectEvent_expectABC_getAB: {
    describe: 'when expecting events A-B-C, but only got A-B',
    it: 'should fail on startEvent B',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.expectEventOnce('myEventC')

      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishTest()
    },
  },

  testExpectEvent_expectABC_getAC: {
    describe: 'when expecting events A-B-C, but only got A-C',
    it: 'should fail on startEvent B',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')
      test.expectEventOnce('myEventC')

      test.startEvent('myEventA')
      test.startEvent('myEventC')

      test.finishTest()
    },
  },

  testExpectEvent_expectABC_getAC_diffOrder: {
    describe: 'when expecting events A-B-C, but only got A-C, with diff order',
    it: 'should fail on startEvent B',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEventOnce('myEventA')
      test.expectEventOnce('myEventB')

      test.startEvent('myEventA')

      test.expectEventOnce('myEventC')
      test.startEvent('myEventC')

      test.finishTest()
    },
  },

  testAppendData: {
    describe: 'when',
    it: 'should',
    runZestTest: (test: ZTest, runJest: boolean) => {
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
  },
  template: {
    describe: 'when',
    it: 'should',
    runZestTest: (test: ZTest, runJest: boolean) => {},
  },
}

const AllJestTestsTypeChecker: { [key: string]: JestTestConfig } =
  allJestConfigs

export const allJestTestNames = Object.keys(allJestConfigs) as JestTestName[]
export type JestTestName = keyof typeof allJestConfigs
export const JestConfigForName = (name: JestTestName) => allJestConfigs[name]

function testExpectThreeEventsToOccur_MultiFrameFail() {
  const test: ZTest = createZestTest('testExpectThreeEventsToOccur_Success')
  // test.expectEventNTimes('myEventA', 3)
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
  const test: ZTest = createZestTest('testOneEventInOneFrame')
  test.startEvent('myEventA')
  test.appendData('myKey1', 'myValue1')
  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testExpectStringEquality() {
  const test: ZTest = createZestTest('testExpectStringEquality')
  test.startEvent('myEventAA')

  test.expectEqual('myKey', 'myStringAA', 'myStringAA')
  test.expectEqual('myKey', 'myActualStringBB', 'myExpectedStringBB')

  // test.finishFrame((testResult) => {
  //    displayTextOnHTML(testResult)
  // })
}

function testExpectNonZeroEquality_MultiFrame() {
  const test: ZTest = createZestTest('testExpectNonZeroEquality_MultiFrame')
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
  let library = new ZTestsRunner()
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
  let library = new ZTestsRunner()
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
  let library = new ZTestsRunner()
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
  let library = new ZTestsRunner()
  const test = 'NewEmptyTest'
  library.startTest(test)

  library.finishFrame((result) => {
    // displayTextOnHTML(result)
  })
}

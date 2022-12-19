import { Vec3 } from '../../HorizonShim/HZShim'
import ZTest, { createZestTest, ZTestResult } from '../ZTest'
import { ZTestsRunner } from '../ZTestsRunner'

export type JestTestConfig = {
  describe: string
  it: string
  runZestTest: (test: ZTest, runJest: boolean) => void
}

export const allJestConfigs = {
  testValueExpectations_stringEquality: {
    describe: 'when expecting keys',
    it: 'should evaluate correctly data',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.finishFrame()

      test.expectEqual('myKey', 'myStringA', 'myStringA')
      test.expectEqual('myKey', 'myStringA', 'myStringB')
      test.finishFrame()

      test.expectNotEqual('myKey', 'myStringA', 'myStringA')
      test.expectNotEqual('myKey', 'myStringA', 'myStringB')
      test.finishFrame()
    },
  },

  testValueExpectations_notZero: {
    describe: 'when expecting keys',
    it: 'should evaluate correctly data',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.finishFrame()

      test.expectNotEmpty('notZeroNumKey', 99)
      test.expectNotEmpty('zeroNumKey', 0)
      test.warnNotEmpty('notZeroVecKey', 99)
      test.warnNotEmpty('zeroNumKey', 0)
      test.finishFrame()

      test.expectNotEmpty('notZeroVecKey', new Vec3(8, 2, 1))
      test.expectNotEmpty('zeroVecKey', Vec3.zero)
      test.warnNotEmpty('notZeroVecKey', new Vec3(8, 2, 1))
      test.warnNotEmpty('zeroVecKey', Vec3.zero)
      test.finishFrame()

      test.expectNotEmpty('notZeroKey', 'notZeroStr')
      test.expectNotEmpty('zeroStrKey', '0')
      test.expectNotEmpty('emptyStrKey', '')
      test.warnNotEmpty('notZeroKey', 'notZeroStr')
      test.warnNotEmpty('zeroStrKey', '0')
      test.warnNotEmpty('emptyStrKey', '')
      test.finishFrame()
    },
  },

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
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.expectEvent('myEventC')

      test.finishTest()
    },
  },

  testExpectEvent_expectAB_gotEventAB: {
    describe: 'when expecting event A-B, and recieving event A-B',
    it: 'should pass both events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishTest()
    },
  },

  testExpectEvent_expectAA_gotEventAA: {
    describe: 'when expecting event A-B, and recieving event A-B',
    it: 'should pass both events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventA')

      test.finishTest()
    },
  },

  testExpectEvent_expectAB_gotEventCD: {
    describe: 'when expecting event A-B, and recieving event C-D',
    it: 'should pass events',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.startEvent('myEventC')
      test.startEvent('myEventD')

      test.finishTest()
    },
  },

  testExpectEvent_expectBeforeStartEvent: {
    describe: 'when expecting 1 event, but get 2 in one frame',
    it: 'should fail when second event is received',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishFrame()
    },
  },

  testExpectEvent_expectBeforeStartEvent_newFrame: {
    describe: 'when expectEvent is on frame 0, and startEvent on frame 2 & 3',
    it: 'should fail both startEvents on frame 2 & 3',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
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
      test.expectEvent('myEventA')
      test.finishFrame()
    },
  },

  testExpectEvent_finishTest_newFrame: {
    describe: 'when finishTest is called with unfinished expects on frame 3',
    it: 'should fail expectations on frame 3',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
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
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.expectEvent('myEventC')

      test.startEvent('myEventA')
      test.startEvent('myEventB')

      test.finishTest()
    },
  },

  testExpectEvent_expectABC_getAC: {
    describe: 'when expecting events A-B-C, but only got A-C',
    it: 'should fail on startEvent B',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.expectEvent('myEventC')

      test.startEvent('myEventA')
      test.startEvent('myEventC')

      test.finishTest()
    },
  },

  testExpectEvent_expectABC_getAC_diffOrder: {
    describe: 'when expecting events A-B-C, but only got A-C, with diff order',
    it: 'should fail on startEvent B',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')

      test.startEvent('myEventA')

      test.expectEvent('myEventC')
      test.startEvent('myEventC')

      test.finishTest()
    },
  },

  testAppendData: {
    describe: 'when appending data',
    it: 'should display data',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.expectEvent('myEventA')
      test.appendData('myKey1', 'myValue1')
      test.startEvent('myEventA')
      test.appendData('myKey2', 'myValue2')
      test.finishFrame()
    },
  },

  testUpdateResult_onEmptyTest: {
    describe: 'when finishFrame() on an empty test',
    it: 'should return TestResults on next frame',
    runZestTest: (test: ZTest, runJest: boolean) => {
      let count = 0
      let result: ZTestResult | null

      test.addResultListener((result) => {
        count++
      })
      if (runJest) {
        expect(count).toBe(0)
      }

      result = test.finishFrame()
      if (runJest) {
        expect(result).not.toBeNull()
      }

      result = test.finishFrame()
      if (runJest) {
        expect(result).toBeNull()
      }
    },
  },

  testUpdateResult_onFinishFrame: {
    describe: 'when finishFrame()',
    it: 'should not return TestResults when an update is not needed.',
    runZestTest: (test: ZTest, runJest: boolean) => {
      let count = 0
      let result: ZTestResult | null
      test.addResultListener((result) => {
        count++
      })
      test.expectEvent('myEventA')
      test.expectEvent('myEventB')
      test.startEvent('myEventA')
      test.startEvent('myEventB')
      result = test.finishFrame()
      if (runJest) {
        expect(result).not.toBeNull()
      }

      result = test.finishFrame()
      if (runJest) {
        expect(result).toBeNull()
      }

      result = test.finishFrame()
      if (runJest) {
        expect(result).toBeNull()
      }

      test.expectEvent('myEventC')
      test.startEvent('myEventC')
      result = test.finishFrame()
      if (runJest) {
        expect(result).not.toBeNull()
      }
      result = test.finishFrame()
      if (runJest) {
        expect(result).toBeNull()
      }

      if (runJest) {
        expect(count).toBe(2)
      }
    },
  },
}

// @ts-ignore
const AllJestTestsTypeChecker: { [key: string]: JestTestConfig } =
  allJestConfigs

export const allJestTestNames = Object.keys(allJestConfigs) as JestTestName[]
export type JestTestName = keyof typeof allJestConfigs
export const JestConfigForName = (name: JestTestName) => allJestConfigs[name]

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

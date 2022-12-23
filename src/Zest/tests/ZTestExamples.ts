import { Vec3 } from '../../HorizonShim/HZShim'
import { ZTestResult, ZTest } from '../ZTest'

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
      test.expectNotEmptyW('notZeroVecKey', 99)
      test.expectNotEmptyW('zeroNumKey', 0)
      test.finishFrame()

      test.expectNotEmpty('notZeroVecKey', new Vec3(8, 2, 1))
      test.expectNotEmpty('zeroVecKey', Vec3.zero)
      test.expectNotEmptyW('notZeroVecKey', new Vec3(8, 2, 1))
      test.expectNotEmptyW('zeroVecKey', Vec3.zero)
      test.finishFrame()

      test.expectNotEmpty('notZeroKey', 'notZeroStr')
      test.expectNotEmpty('zeroStrKey', '0')
      test.expectNotEmpty('emptyStrKey', '')
      test.expectNotEmptyW('notZeroKey', 'notZeroStr')
      test.expectNotEmptyW('zeroStrKey', '0')
      test.expectNotEmptyW('emptyStrKey', '')
      test.finishFrame()
    },
  },

  testValueExpectations_warnsOnly: {
    describe: 'when expecting keys with only warns',
    it: 'should result in passStatus of WARN',
    runZestTest: (test: ZTest, runJest: boolean) => {
      test.finishFrame()

      test.expectNotEmptyW('notZeroVecKey', 99)
      test.expectNotEmptyW('zeroNumKey', 0)
      test.finishFrame()

      test.expectNotEmptyW('notZeroVecKey', new Vec3(8, 2, 1))
      test.expectNotEmptyW('zeroVecKey', Vec3.zero)
      test.finishFrame()

      test.expectNotEmptyW('notZeroKey', 'notZeroStr')
      test.expectNotEmptyW('zeroStrKey', '0')
      test.expectNotEmptyW('emptyStrKey', '')
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
      test.appendDataKeyValue('myKey1', 'myValue1')
      test.startEvent('myEventA')
      test.appendDataKeyValue('myKey2', 'myValue2')
      test.finishFrame()

      test.appendData('String1')
      test.appendData('String1', 'String2')
      test.appendData('String1', 'String2', 'String3')
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

        // To avoid over-updating, only update the resultListeners after a frame is finished.
        expect(count).toBe(1)
      }

      result = test.finishFrame()
      if (runJest) {
        expect(result).toBeNull()
        expect(count).toBe(1)
      }
    },
  },

  testUpdateResult_onEmptyTest_withFinishTest: {
    describe: 'when finishTest() is called on an empty test',
    it: 'should return TestResults on next frame',
    runZestTest: (test: ZTest, runJest: boolean) => {
      let count = 0
      let result: ZTestResult | null

      test.addResultListener((result) => {
        count++
      })
      result = test.finishTest()
      if (runJest) {
        expect(count).toBe(1)
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

  testFinishFrameWDelay_triggerEnterExit_happyPath: {
    describe: 'Test Zest for trigger enter exit, happy path',
    it: 'Should succeed test',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)

      test.expectEvent('TriggerEnter')
      test.expectEvent('TriggerExit')
      result = test.finishFrame()

      test.startEvent('TriggerEnter')
      test.startEvent('TriggerExit')
      result = test.finishFrame()
    },
  },

  testFinishFrameWDelay_triggerEnterExit_missingEnter: {
    describe: 'Test Zest for trigger enter exit, missing trigger ENTER',
    it: 'Should fail test',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)

      test.expectEvent('TriggerEnter')
      test.expectEvent('TriggerExit')
      result = test.finishFrame()

      test.startEvent('TriggerExit')
      test.finishTest()
      result = test.finishFrame()
      if (runJest) {
        expect(result).not.toBeUndefined()
      }
    },
  },

  testFinishFrameWDelay_triggerEnterExit_missingExit: {
    describe: 'Test Zest for trigger enter exit, missing trigger EXIT',
    it: 'Should fail test',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      let testResultFn = runJest
        ? jest.fn((testResult: ZTestResult) => {})
        : undefined
      if (testResultFn) {
        test.addResultListener(testResultFn)

        let count = 0
        test.addResultListener((testResult: ZTestResult) => {
          count++
          if (count === 2) {
            expect(testResult.status.passStatus === 'FAIL')
            expect(testResult.status.done === true)
          }
        })
      }

      test.finishTestWithDelay(0.8, setTimeout)
      test.expectEvent('TriggerEnter')
      test.expectEvent('TriggerExit')

      result = test.finishFrame()
      result = test.finishFrame()
      result = test.finishFrame()

      test.startEvent('TriggerEnter')
      result = test.finishFrame()

      if (runJest) {
        expect(result).not.toBeFalsy()
        expect(result?.status.passStatus === 'RUNNING')
        expect(testResultFn).toBeCalledTimes(2)
      }
    },
  },

  testCombo_collisions_pass: {
    describe: 'Test Zest for collisions',
    it: 'Should pass test',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)

      test.expectEvent('Collision')
      test.startEvent('Collision')

      result = test.finishFrame()
    },
  },

  testCombo_collisions_multipleEvents: {
    describe: 'Test Zest for multiple collisions',
    it: 'Should fail test when there are more than 1 per frame',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)

      test.expectEvent('Collision')
      test.startEvent('Collision')
      test.startEvent('Collision')
      test.startEvent('Collision')
      test.startEvent('Collision')

      result = test.finishFrame()
      result = test.finishFrame()
      result = test.finishFrame()

      test.startEvent('CollisionInfo')
      test.startEvent('CollisionInfo')
      test.startEvent('CollisionInfo')

      test.expectEvent('CollisionInfo')
      test.expectEvent('CollisionInfo')
      test.expectEvent('CollisionInfo')
      result = test.finishFrame()

      test.expectEvent('CollisionInfo')
      test.expectEvent('CollisionInfo')

      result = test.finishFrame()
    },
  },

  testMultipleExpectEvents_waitingOnExpectEvents: {
    describe: 'Test Zest for multiple expects in a row',
    it: 'Should display that lines repeated 3, 2, 4 times',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)
      test.expectEvent('Collision')
      test.expectEvent('Collision')
      test.expectEvent('Collision')

      test.expectEvent('CollisionInfo')
      test.expectEvent('CollisionInfo')

      test.expectEvent('Collision')
      test.expectEvent('Collision')
      test.expectEvent('Collision')
      test.expectEvent('Collision')
    },
  },

  testCombo_collisions_multipleEventsWarn: {
    describe: 'Test Zest for warnings per frame',
    it: 'Should have status of WARN',
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(0.8, setTimeout)
      test.expectEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')

      result = test.finishFrame()
      result = test.finishFrame()
      result = test.finishFrame()

      test.startEventW('CollisionInfo')
      test.startEventW('CollisionInfo')
      test.startEventW('CollisionInfo')

      test.expectEventW('CollisionInfo')
      test.expectEventW('CollisionInfo')
      test.expectEventW('CollisionInfo')
      result = test.finishFrame()

      test.expectEventW('CollisionInfo')

      result = test.finishFrame()
      test.expectEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')
      test.startEventW('Collision')
      result = test.finishFrame()
      if (runJest) {
        expect(result?.status.passStatus).toBe('WARN')
      }
    },
  },

  testFinishFrameWDelay_cancelTest: {
    describe: 'Test Zest for canceling all ongoing listeners',
    it: "Should have status CANCEL, and shouldn't display async finishEvent",
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(1, setTimeout)
      test.expectEvent('TriggerEnter')
      result = test.finishFrame()

      test.cancelTest()
      result = test.finishFrame()

      test.expectEvent('TriggerExit')
      result = test.finishFrame()
    },
  },

  testFinishFrameWDelay_invalidateTest: {
    describe: 'Test Zest for canceling all ongoing listeners',
    it: "Should have status INVALID, and shouldn't display async finishEvent",
    runZestTest: (test: ZTest, runJest: boolean) => {
      if (runJest) {
        jest.useFakeTimers()
      }

      let result: ZTestResult | null
      test.finishTestWithDelay(1, setTimeout)
      test.expectEvent('TriggerEnter')
      result = test.finishFrame()

      test.cancelTest()
      result = test.finishFrame()

      test.expectEvent('TriggerExit')
      result = test.finishFrame()
    },
  },
}

// @ts-ignore
const AllJestTestsTypeChecker: { [key: string]: JestTestConfig } =
  allJestConfigs

export const allJestTestNames = Object.keys(allJestConfigs) as JestTestName[]
export type JestTestName = keyof typeof allJestConfigs
export const JestConfigForName = (name: JestTestName) => allJestConfigs[name]

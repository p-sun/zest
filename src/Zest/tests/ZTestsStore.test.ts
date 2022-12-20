import { CreateZTestsStore as CreateZTestsStore, ZTestResult } from '../ZTest'

describe('Test Zest for trigger enter exit, happy path', () => {
  it('Only first finishFrame has result', () => {
    let store = CreateZTestsStore()
    const test = store.startTest('NewTestA')
    let result: ZTestResult | null
    test.addResultListener((testResult) => {})

    test.expectEvent('OnTriggerEnter')
    test.expectEvent('OnTriggerExit')

    result = store.finishFrame()
    expect(result).not.toBeNull()

    result = store.finishFrame()
    expect(result).toBeNull()

    result = store.finishFrame()
    expect(result).toBeNull()

    test.startEvent('OnTriggerEnter')
    result = store.finishFrame()
    expect(result).not.toBeNull()

    test.startEvent('OnTriggerExit')

    result = store.finishFrame()
    expect(result).not.toBeNull()

    result = store.finishFrame()
    expect(result).toBeNull()
  })
})

describe('Test Zest for trigger enter exit, missing trigger enter', () => {
  it('Should fail test', () => {
    let store = CreateZTestsStore()
    const test = store.startTest('NewTestA')
    let result: ZTestResult | null
    test.addResultListener((testResult) => {})

    test.expectEvent('OnTriggerEnter')
    test.expectEvent('OnTriggerExit')
    result = store.finishFrame()

    test.startEvent('OnTriggerExit')
    result = store.finishFrame()
    expect(result).not.toBeNull()

    result = store.finishFrame()
    expect(result).toBeNull()
  })
})

describe('Test update results for current test', () => {
  it('Should only update result listeners once per frame as needed', () => {
    let store = CreateZTestsStore()
    const testA = store.startTest('TestA')
    const testB = store.startTest('TestB')
    let result: ZTestResult | null

    let countA = 0
    let countB = 0
    let countCurrent = 0
    store.addCurrentResultListener((testResult) => {
      countCurrent++
    })
    testA.addResultListener((testResult) => {
      countA++
    })
    testA.expectEvent('OnTriggerEnter')
    testA.expectEvent('OnTriggerExit')

    testB.addResultListener((testResult) => {
      countB++
    })
    testB.expectEvent('OnCollision')

    result = store.finishFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(1)
    expect(countCurrent).toBe(1)

    testB.expectEvent('OnCollision')
    result = store.finishFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(1)

    testA.expectEvent('OnTriggerEnter')
    result = store.finishFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(2)

    store.setCurrentTest('TestB')
    testB.expectEvent('OnCollision')
    result = store.finishFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(3)
    expect(countCurrent).toBe(3)
  })
})

function testNewTestWithDataAppendsOnly() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null
  const test = store.startTest('NewTestA')
  test.appendDataKeyValue('keyA', 'valueA')
  test.appendDataKeyValue('keyB', 'valueB')
  result = store.finishFrame()

  test.appendDataKeyValue('keyC', 'valueC')
  test.appendDataKeyValue('keyD', 'valueD')
  result = store.finishFrame()
}

function testNewMultiTests_WithDataAppendsOnly() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  store.startTest(testA)
  store.startTest(testB)

  store.getTest(testB)?.appendDataKeyValue('keyAAA', 'valueBBB')
  store.getTest(testA)?.appendDataKeyValue('keyA', 'valueA')
  store.getTest(testA)?.appendDataKeyValue('keyB', 'valueB')
  result = store.finishFrame()

  store.getTest(testA)?.appendDataKeyValue('keyC', 'valueC')
  store.getTest(testB)?.appendDataKeyValue('keyCCC', 'valueCCC')
  store.getTest(testA)?.appendDataKeyValue('keyD', 'valueD')
  store.getTest(testB)?.appendDataKeyValue('keyKKK', 'valueKKK')
  result = store.finishFrame()
}

function testNewMultiTests_TestBHasOnlyOneFrame() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  // Most recent 'startTest()' decides the current test
  store.startTest(testA)
  store.startTest(testB)

  store.getTest(testA)?.appendDataKeyValue('keyA', 'valueA')
  result = store.finishFrame()

  // testB only has one event, so it only displays FIRST FRAME
  store.getTest(testB)?.appendDataKeyValue('keyKKK', 'valueKKK')
  store.getTest(testA)?.appendDataKeyValue('keyD', 'valueD')
  result = store.finishFrame()

  // Finishing another frame doesn't change testA and testB results
  result = store.finishFrame()

  // Display results from any previous test
  // // displayTextOnHTML(store.getTestResults(testA)!)
  // // displayTextOnHTML(store.getTestResults(testB)!)
}

function testEmptyStartTest() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null

  const test = 'NewEmptyTest'
  store.startTest(test)
  result = store.finishFrame()
}

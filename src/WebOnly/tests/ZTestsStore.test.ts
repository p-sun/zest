import {
  CreateZTestsStore as CreateZTestsStore,
  ZTestResult,
} from '../../Zest/ZTest'

describe('Test Zest for trigger enter exit, happy path', () => {
  it('Only first updateFrame has result', () => {
    let store = CreateZTestsStore()
    const test = store.startTest('NewTestA')
    let result: ZTestResult | null
    test.addResultListener((testResult) => {})

    test.expectEvent('OnTriggerEnter')
    test.expectEvent('OnTriggerExit')

    result = store.updateFrame()
    expect(result).not.toBeNull()

    result = store.updateFrame()
    expect(result).toBeNull()

    result = store.updateFrame()
    expect(result).toBeNull()

    test.detectEvent('OnTriggerEnter')
    result = store.updateFrame()
    expect(result).not.toBeNull()

    test.detectEvent('OnTriggerExit')

    result = store.updateFrame()
    expect(result).not.toBeNull()

    result = store.updateFrame()
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
    result = store.updateFrame()

    test.detectEvent('OnTriggerExit')
    result = store.updateFrame()
    expect(result).not.toBeNull()

    result = store.updateFrame()
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
    let countAll = 0
    store.addCurrentResultListener((testResult) => {
      countCurrent++
    })
    store.addResultListener((testResult) => {
      countAll++
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

    result = store.updateFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(1)
    expect(countCurrent).toBe(1)
    expect(countAll).toBe(2) // One for each test

    testB.expectEvent('OnCollision')
    result = store.updateFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(1)
    expect(countAll).toBe(3)

    testA.expectEvent('OnTriggerEnter')
    result = store.updateFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(2)
    expect(countAll).toBe(4)

    store.setCurrentTest('TestB')
    testB.expectEvent('OnCollision')
    result = store.updateFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(3)
    expect(countCurrent).toBe(3)
    expect(countAll).toBe(5)
  })
})

function testNewTestWithDataAppendsOnly() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null
  const test = store.startTest('NewTestA')
  test.appendData('keyA', 'valueA')
  test.appendData('keyB', 'valueB')
  result = store.updateFrame()

  test.appendData('keyC', 'valueC')
  test.appendData('keyD', 'valueD')
  result = store.updateFrame()
}

function testNewMultiTests_WithDataAppendsOnly() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  store.startTest(testA)
  store.startTest(testB)

  store.getTest(testB)?.appendData('keyAAA', 'valueBBB')
  store.getTest(testA)?.appendData('keyA', 'valueA')
  store.getTest(testA)?.appendData('keyB', 'valueB')
  result = store.updateFrame()

  store.getTest(testA)?.appendData('keyC', 'valueC')
  store.getTest(testB)?.appendData('keyCCC', 'valueCCC')
  store.getTest(testA)?.appendData('keyD', 'valueD')
  store.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  result = store.updateFrame()
}

function testNewMultiTests_TestBHasOnlyOneFrame() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null | undefined

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  // Most recent 'startTest()' decides the current test
  store.startTest(testA)
  store.startTest(testB)

  store.getTest(testA)?.appendData('keyA', 'valueA')
  result = store.updateFrame()

  // testB only has one event, so it only displays FIRST FRAME
  store.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  store.getTest(testA)?.appendData('keyD', 'valueD')
  result = store.updateFrame()

  // Finishing another frame doesn't change testA and testB results
  result = store.updateFrame()

  // Display results from any previous test
  result = store.getTestResult('NewTestA')
  result = store.getTestResult('NewTestB')
}

function testEmptyStartTest() {
  let store = CreateZTestsStore()
  let result: ZTestResult | null

  const test = 'NewEmptyTest'
  store.startTest(test)
  result = store.updateFrame()
}

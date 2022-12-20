import { CreateZTestsRunner, ZTestResult } from '../ZTest'

describe('Test Zest for trigger enter exit, happy path', () => {
  it('Only first finishFrame has result', () => {
    let library = CreateZTestsRunner()
    const test = library.startTest('NewTestA')
    let result: ZTestResult | null
    test.addResultListener((testResult) => {})

    test.expectEvent('OnTriggerEnter')
    test.expectEvent('OnTriggerExit')

    result = library.finishFrame()
    expect(result).not.toBeNull()

    result = library.finishFrame()
    expect(result).toBeNull()

    result = library.finishFrame()
    expect(result).toBeNull()

    test.startEvent('OnTriggerEnter')
    result = library.finishFrame()
    expect(result).not.toBeNull()

    test.startEvent('OnTriggerExit')

    result = library.finishFrame()
    expect(result).not.toBeNull()

    result = library.finishFrame()
    expect(result).toBeNull()
  })
})

describe('Test Zest for trigger enter exit, missing trigger enter', () => {
  it('Should fail test', () => {
    let library = CreateZTestsRunner()
    const test = library.startTest('NewTestA')
    let result: ZTestResult | null
    test.addResultListener((testResult) => {})

    test.expectEvent('OnTriggerEnter')
    test.expectEvent('OnTriggerExit')
    result = library.finishFrame()

    test.startEvent('OnTriggerExit')
    result = library.finishFrame()
    expect(result).not.toBeNull()

    result = library.finishFrame()
    expect(result).toBeNull()
  })
})

describe('Test update results for current test', () => {
  it('Should only update result listeners once per frame as needed', () => {
    let library = CreateZTestsRunner()
    const testA = library.startTest('TestA')
    const testB = library.startTest('TestB')
    let result: ZTestResult | null

    let countA = 0
    let countB = 0
    let countCurrent = 0
    library.addCurrentResultListener((testResult) => {
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

    result = library.finishFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(1)
    expect(countCurrent).toBe(1)

    testB.expectEvent('OnCollision')
    result = library.finishFrame()

    expect(countA).toBe(1)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(1)

    testA.expectEvent('OnTriggerEnter')
    result = library.finishFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(2)
    expect(countCurrent).toBe(2)

    library.setCurrentTest('TestB')
    testB.expectEvent('OnCollision')
    result = library.finishFrame()

    expect(countA).toBe(2)
    expect(countB).toBe(3)
    expect(countCurrent).toBe(3)
  })
})

function testNewTestWithDataAppendsOnly() {
  let library = CreateZTestsRunner()
  let result: ZTestResult | null
  const test = library.startTest('NewTestA')
  test.appendData('keyA', 'valueA')
  test.appendData('keyB', 'valueB')
  result = library.finishFrame()

  test.appendData('keyC', 'valueC')
  test.appendData('keyD', 'valueD')
  result = library.finishFrame()
}

function testNewMultiTests_WithDataAppendsOnly() {
  let library = CreateZTestsRunner()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testB)?.appendData('keyAAA', 'valueBBB')
  library.getTest(testA)?.appendData('keyA', 'valueA')
  library.getTest(testA)?.appendData('keyB', 'valueB')
  result = library.finishFrame()

  library.getTest(testA)?.appendData('keyC', 'valueC')
  library.getTest(testB)?.appendData('keyCCC', 'valueCCC')
  library.getTest(testA)?.appendData('keyD', 'valueD')
  library.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  result = library.finishFrame()
}

function testNewMultiTests_TestBHasOnlyOneFrame() {
  let library = CreateZTestsRunner()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  // Most recent 'startTest()' decides the current test
  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testA)?.appendData('keyA', 'valueA')
  result = library.finishFrame()

  // testB only has one event, so it only displays FIRST FRAME
  library.getTest(testB)?.appendData('keyKKK', 'valueKKK')
  library.getTest(testA)?.appendData('keyD', 'valueD')
  result = library.finishFrame()

  // Finishing another frame doesn't change testA and testB results
  result = library.finishFrame()

  // Display results from any previous test
  // // displayTextOnHTML(library.getTestResults(testA)!)
  // // displayTextOnHTML(library.getTestResults(testB)!)
}

function testEmptyStartTest() {
  let library = CreateZTestsRunner()
  let result: ZTestResult | null

  const test = 'NewEmptyTest'
  library.startTest(test)
  result = library.finishFrame()
}

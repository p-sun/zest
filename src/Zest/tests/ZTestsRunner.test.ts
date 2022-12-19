import { ZTestResult } from '../ZTest'
import { ZTestsRunner } from '../ZTestsRunner'

describe('Test Zest for trigger enter exit, happy path', () => {
  it('Only first finishFrame has result', () => {
    let library = new ZTestsRunner()
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
    let library = new ZTestsRunner()
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

function testNewTestWithDataAppendsOnly() {
  let library = new ZTestsRunner()
  let result: ZTestResult | null
  const test = library.startTest('NewTestA')
  test.logData('keyA', 'valueA')
  test.logData('keyB', 'valueB')
  result = library.finishFrame()

  test.logData('keyC', 'valueC')
  test.logData('keyD', 'valueD')
  result = library.finishFrame()
}

function testNewMultiTests_WithDataAppendsOnly() {
  let library = new ZTestsRunner()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testB)?.logData('keyAAA', 'valueBBB')
  library.getTest(testA)?.logData('keyA', 'valueA')
  library.getTest(testA)?.logData('keyB', 'valueB')
  result = library.finishFrame()

  library.getTest(testA)?.logData('keyC', 'valueC')
  library.getTest(testB)?.logData('keyCCC', 'valueCCC')
  library.getTest(testA)?.logData('keyD', 'valueD')
  library.getTest(testB)?.logData('keyKKK', 'valueKKK')
  result = library.finishFrame()
}

function testNewMultiTests_TestBHasOnlyOneFrame() {
  let library = new ZTestsRunner()
  let result: ZTestResult | null

  const testA = 'NewTestA'
  const testB = 'NewTestB'

  // Most recent 'startTest()' decides the current test
  library.startTest(testA)
  library.startTest(testB)

  library.getTest(testA)?.logData('keyA', 'valueA')
  result = library.finishFrame()

  // testB only has one event, so it only displays FIRST FRAME
  library.getTest(testB)?.logData('keyKKK', 'valueKKK')
  library.getTest(testA)?.logData('keyD', 'valueD')
  result = library.finishFrame()

  // Finishing another frame doesn't change testA and testB results
  result = library.finishFrame()

  // Display results from any previous test
  // // displayTextOnHTML(library.getTestResults(testA)!)
  // // displayTextOnHTML(library.getTestResults(testB)!)
}

function testEmptyStartTest() {
  let library = new ZTestsRunner()
  let result: ZTestResult | null

  const test = 'NewEmptyTest'
  library.startTest(test)
  result = library.finishFrame()
}

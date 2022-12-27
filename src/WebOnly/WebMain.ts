import {
  GridData,
  Direction,
  IndexForCellPosition,
  CellPositionForIndex,
  CharForPassStatus,
} from '../HorizonUtils/GridData'
import { ZTest, ZTestResult, ZTestsStoreImpl } from '../Zest/ZTest'
import {
  JestTestName,
  allJestConfigs,
  allJestTestNames,
} from '../Zest/tests/ZTestExamples'

type WebMainUpdateListener = (
  isCurrentTest: boolean,
  testResult?: ZTestResult
) => void

export class WebMain {
  private readonly localStorageKey = 'currentName'
  private store = new ZTestsStoreImpl()
  private updateListener: WebMainUpdateListener | undefined
  private runTestFn: ((testName: string, test: ZTest) => void) | undefined

  constructor(public gridData: GridData) {}

  start() {
    const storedName = localStorage.getItem(
      this.localStorageKey
    ) as JestTestName

    const currentName = allJestConfigs[storedName]
      ? storedName
      : allJestTestNames[0]
    this.runTestWithName(currentName)
  }

  getCurrentTestName() {
    return this.store.currentTestData?.testName
  }

  setTestRunner(runTest: (testName: string, test: ZTest) => void) {
    this.runTestFn = runTest
  }

  setListener(listener: WebMainUpdateListener) {
    this.updateListener = listener
    this.store.addResultListener(
      (testResult: ZTestResult, isCurrentTest: boolean) => {
        let char = CharForPassStatus(testResult.status.passStatus)
        if (char) {
          const index = allJestTestNames.indexOf(testResult.testName as any)
          const cellPos = CellPositionForIndex(index, this.gridData.size)
          this.gridData.setCharAt(cellPos, char)
        }

        listener(isCurrentTest, testResult)
      }
    )
  }

  selectDirection(direction: Direction) {
    this.gridData.moveSelectedCellPosIn(direction)
    const index = IndexForCellPosition(
      this.gridData.selectedCellPos,
      this.gridData.size
    )
    if (index < allJestTestNames.length) {
      this.selectName(allJestTestNames[index])
    } else {
      // Update the grid when a test DNE for that cellPosition
      this.updateListener?.(false)
    }
  }

  runTestWithName(testName: JestTestName): ZTest {
    localStorage.setItem(this.localStorageKey, testName)

    let index = allJestTestNames.indexOf(testName)
    this.gridData.selectCellPosition(
      CellPositionForIndex(index, this.gridData.size)
    )

    const test = this.store.startTest(testName)
    this.store.setCurrentTest(testName)

    this.runTestFn?.(testName, test)
    return test
  }
}

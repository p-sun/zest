import {
  GridData,
  Direction,
  IndexForCellPosition,
  CellPositionForIndex,
  CharForPassStatus,
} from '../HorizonUtils/GridData'
import {
  CreateZTestsStore,
  ZTest,
  ZTestResult,
  ZTestsStore,
} from '../Zest/ZTest'

export interface ZGridRunnerDataSource {
  testNameForIndex(index: number): string | undefined
  indexForTestName(testName: string): number
}

type GridRunnerListener = (
  isCurrentTest: boolean,
  testResult?: ZTestResult
) => void

export class ZGridTestRunner {
  private store: ZTestsStore = CreateZTestsStore()
  private runTestFn: ((testName: string, test: ZTest) => void) | undefined

  constructor(
    public gridData: GridData,
    public dataSource: ZGridRunnerDataSource
  ) {}

  getCurrentTestName() {
    return this.store.getCurrentTest()?.testName
  }

  setTestRunner(runTest: (testName: string, test: ZTest) => void) {
    this.runTestFn = runTest
  }

  setListener(listener: GridRunnerListener) {
    this.store.addResultListener(
      (testResult: ZTestResult, isCurrentTest: boolean) => {
        let char = CharForPassStatus(testResult.status.passStatus)
        if (char) {
          const index = this.dataSource.indexForTestName(testResult.testName)
          const cellPos = CellPositionForIndex(index, this.gridData.size)
          this.gridData.setCharAt(cellPos, char)
        }

        listener(isCurrentTest, testResult)
      }
    )
  }

  selectDirection(direction: Direction) {
    const newCellPos = this.gridData.cellPosInDirection(direction)
    const index = IndexForCellPosition(newCellPos, this.gridData.size)
    const testName = this.dataSource.testNameForIndex(index)
    if (index >= 0 && testName) {
      this.gridData.selectCellPosition(newCellPos)
      this.runTestWithName(testName)
    }
  }

  runTestWithName(testName: string): ZTest {
    let index = this.dataSource.indexForTestName(testName)
    if (index >= 0) {
      this.gridData.selectCellPosition(
        CellPositionForIndex(index, this.gridData.size)
      )
    }

    const test = this.store.startTest(testName)
    this.store.setCurrentTest(testName)
    this.runTestFn?.(testName, test)
    return test
  }
}

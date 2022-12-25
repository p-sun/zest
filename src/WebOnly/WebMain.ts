import {
  GridData,
  Direction,
  IndexForCellPosition,
  CellPositionForIndex,
  CharForPassStatus,
} from '../HorizonUtils/GridData'
import { ZTest, ZTestImpl, ZTestResult } from '../Zest/ZTest'
import {
  JestTestName,
  allJestConfigs,
  allJestTestNames,
  JestConfigForName,
  JestTestConfig,
} from '../Zest/tests/ZTestExamples'

type WebMainUpdateListener = (
  testResult?: ZTestResult,
  jestConfig?: JestTestConfig
) => void

export class WebMain {
  private readonly localStorageKey = 'currentName'
  public currentName: JestTestName
  public currentTestId: string = ''
  private updateListener: WebMainUpdateListener | undefined

  constructor(public gridData: GridData) {
    this.currentName = allJestTestNames[0]
  }

  start() {
    const storedName = localStorage.getItem(
      this.localStorageKey
    ) as JestTestName

    this.currentName = allJestConfigs[storedName]
      ? storedName
      : allJestTestNames[0]
    this.selectName(this.currentName)
  }

  setListener(listener: WebMainUpdateListener) {
    this.updateListener = listener
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
      this.updateListener?.()
    }
  }

  selectName(name: JestTestName) {
    this.currentName = name
    localStorage.setItem(this.localStorageKey, this.currentName)

    this.runHTMLTest(name)

    let index = allJestTestNames.indexOf(name)
    this.gridData.selectCellPosition(
      CellPositionForIndex(index, this.gridData.size)
    )

    this.updateListener?.()
  }

  private runHTMLTest(jestTestName: JestTestName) {
    const jestConfig = JestConfigForName(jestTestName)
    const zestTest: ZTest = new ZTestImpl(jestTestName)
    this.currentTestId = zestTest.testId
    zestTest.addResultListener((testResult: ZTestResult) => {
      let char = CharForPassStatus(testResult.status.passStatus)
      if (char) {
        const index = allJestTestNames.indexOf(testResult.testName as any)
        const cellPos = CellPositionForIndex(index, this.gridData.size)
        this.gridData.setCharAt(cellPos, char)
      }

      const testResultToUpdate =
        testResult.testId === this.currentTestId ? testResult : undefined
      this.updateListener?.(testResultToUpdate)
    })
    jestConfig.runZestTest(zestTest, false)
  }
}

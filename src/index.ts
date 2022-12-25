import {
  CellPositionForIndex,
  CharForPassStatus,
  Direction,
  GridData,
  IndexForCellPosition,
  myGridSize,
} from './HorizonUtils/GridData'
import { ZTest, ZTestImpl, ZTestResult } from './Zest/ZTest'
import {
  JestTestName,
  JestConfigForName,
  allJestTestNames,
  allJestConfigs,
} from './Zest/tests/ZTestExamples'

function displayGridOn(element: Element, grid: GridData) {
  element.innerHTML = grid.getText(false)
}

function displayButtonsOn<T extends string>(
  element: Element,
  selectedText: T,
  texts: T[],
  onClick: (text: T) => void
) {
  element.innerHTML = ''

  for (const text of texts) {
    let btn: HTMLButtonElement = document.createElement('button')
    btn.textContent = text
    if (selectedText === text) {
      btn.className = 'selectedButton'
    }
    btn.addEventListener('click', () => onClick(text))
    element.appendChild(btn)
  }
}

function diplayTestResultOn(
  element: Element,
  prependString: string,
  testResult: ZTestResult
) {
  function replaceColorsForHTML(text?: string): string {
    return (text ?? '')
      .replace(
        new RegExp('<color=#([0-9a-fA-F]{6})>', 'g'),
        '<text style="color:#$1;">' // Replace <color=#c5f593>
      )
      .replace(
        new RegExp('<color=#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])>', 'g'),
        '<text style="color:#$1$1$2$2$3$3;">' // Replace <color=#f8a>
      )
      .replace(new RegExp('</color>', 'g'), '</text>')
  }

  element.innerHTML = prependString
  element.innerHTML += '<br><br>' + replaceColorsForHTML(testResult.text)
}

class Main {
  private readonly localStorageKey = 'currentName'
  public currentName: JestTestName
  public currentTestId: string = ''
  private updateListener: (() => void) | undefined

  constructor(public appRoot: Element, public gridData: GridData) {
    const storedName = localStorage.getItem(
      this.localStorageKey
    ) as JestTestName

    this.currentName = allJestConfigs[storedName]
      ? storedName
      : allJestTestNames[0]
    this.selectName(this.currentName)
  }

  setListener(listener: () => void) {
    this.updateListener = listener
  }

  selectDirection(direction: Direction) {
    gridData.moveSelectedCellPosIn(direction)
    const index = IndexForCellPosition(gridData.selectedCellPos, gridData.size)
    if (index < allJestTestNames.length) {
      this.selectName(allJestTestNames[index])
    } else {
      this.updateListener?.()
    }
  }

  selectName(name: JestTestName) {
    this.currentName = name
    localStorage.setItem(this.localStorageKey, this.currentName)

    this.runHTMLTest(this.appRoot, name)

    let index = allJestTestNames.indexOf(name)
    gridData.selectCellPosition(CellPositionForIndex(index, this.gridData.size))

    this.updateListener?.()
  }

  private runHTMLTest(element: Element, jestTestName: JestTestName) {
    const jestConfig = JestConfigForName(jestTestName)
    const prependString = jestConfig.describe + '<br>> ' + jestConfig.it

    const zestTest: ZTest = new ZTestImpl(jestTestName)
    this.currentTestId = zestTest.testId
    zestTest.addResultListener((testResult: ZTestResult) => {
      if (testResult.testId === this.currentTestId) {
        diplayTestResultOn(element, prependString, testResult)
      }
      let char = CharForPassStatus(testResult.status.passStatus)
      if (char) {
        const index = allJestTestNames.indexOf(testResult.testName as any)
        const cellPos = CellPositionForIndex(index, gridData.size)
        gridData.setCharAt(cellPos, char)
      }
      this.updateListener?.()
    })
    jestConfig.runZestTest(zestTest, false)
  }
}

// Prevent window from scrolling on arrow keypress
window.addEventListener(
  'keydown',
  function (e) {
    if (
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(
        e.code
      ) > -1
    ) {
      e.preventDefault()
    }
  },
  false
)

const appRoot = document.getElementsByClassName('testResults').item(0)
const buttonsGroup = document.getElementsByClassName('btn-group').item(0)
const gridRoot = document.getElementsByClassName('grid').item(0)

if (!appRoot || !buttonsGroup || !gridRoot) {
  throw new Error('Main HTML does not include required classes')
}
const updateAll = () => {
  displayButtonsOn(
    buttonsGroup,
    main.currentName,
    allJestTestNames,
    (jestName: JestTestName) => {
      main.selectName(jestName)
    }
  )
  displayGridOn(gridRoot, gridData)
}

const gridData = new GridData({ rowCount: 6, colCount: 6 })
const main = new Main(appRoot, gridData)
main.setListener(() => {
  updateAll()
})
updateAll()

document.onkeydown = function (e) {
  switch (e.key) {
    case 'ArrowUp':
      main.selectDirection('up')
      break
    case 'ArrowDown':
      main.selectDirection('down')
      break
    case 'ArrowRight':
      main.selectDirection('right')
      break
    case 'ArrowLeft':
      main.selectDirection('left')
      break
  }
}

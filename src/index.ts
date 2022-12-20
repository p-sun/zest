import { ZTest, ZTestImpl, ZTestResult } from './Zest/ZTest'
import {
  JestTestName,
  JestConfigForName,
  allJestTestNames,
  allJestConfigs,
} from './Zest/tests/ZTestExamples'

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

  constructor(public appRoot: Element, public buttonsGroup: Element) {
    const storedName = localStorage.getItem(
      this.localStorageKey
    ) as JestTestName

    this.currentName = allJestConfigs[storedName]
      ? storedName
      : allJestTestNames[0]
    this.selectName(this.currentName)
  }

  selectName(name: JestTestName) {
    this.currentName = name
    localStorage.setItem(this.localStorageKey, this.currentName)

    this.runHTMLTest(this.appRoot, name)

    displayButtonsOn(
      this.buttonsGroup,
      this.currentName,
      allJestTestNames,
      (jestName: JestTestName) => {
        this.selectName(jestName)
      }
    )
  }

  selectPrevious() {
    const newIndex = allJestTestNames.indexOf(this.currentName) - 1
    if (newIndex >= 0) {
      this.selectName(allJestTestNames[newIndex])
    }
  }

  selectNext() {
    const newIndex = allJestTestNames.indexOf(this.currentName) + 1
    if (newIndex < allJestTestNames.length) {
      this.selectName(allJestTestNames[newIndex])
    }
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
    })
    jestConfig.runZestTest(zestTest, false)
  }
}

const appRoot = document.getElementsByClassName('testResults').item(0)
const buttonsGroup = document.getElementsByClassName('btn-group').item(0)
if (!appRoot || !buttonsGroup) {
  throw new Error(
    'Main HTML does not include testResults and btn-group classes'
  )
}

const main = new Main(appRoot, buttonsGroup)
document.onkeydown = function (e) {
  switch (e.key) {
    case 'ArrowUp':
      main.selectPrevious()
      break
    case 'ArrowDown':
      main.selectNext()
      break
  }
}

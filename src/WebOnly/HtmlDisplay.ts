import { GridData } from '../HorizonUtils/GridData'
import { ZTestResult } from '../Zest/ZTest'
import {
  allJestTestNames,
  JestConfigForName,
  JestTestName,
} from '../Zest/tests/ZTestExamples'
import { WebMain } from './WebMain'

export function updateHTML(
  webMain: WebMain,
  buttonsGroup: Element,
  testResultElement: Element,
  gridRoot: Element,
  testResult?: ZTestResult
) {
  displayButtonsOn(
    buttonsGroup,
    webMain.currentName,
    allJestTestNames,
    (jestName: JestTestName) => {
      webMain.selectName(jestName)
    }
  )
  displayGridOn(gridRoot, webMain.gridData)

  if (testResult) {
    const jestConfig = JestConfigForName(testResult.testName as any)
    const prependString = jestConfig.describe + '<br>> ' + jestConfig.it
    diplayTestResultOn(testResultElement, prependString, testResult)
  }
}

function displayGridOn(element: Element, grid: GridData) {
  element.innerHTML = grid.getText(false)
  element.innerHTML += `<br><br><text class='arrowKeysPrompt'>
    Use the arrow keys to navigate. <br>Hold right arrow to run all tests.
    <text>`
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

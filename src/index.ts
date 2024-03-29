import { GridData } from './HorizonUtils/GridData'
import { updateHTML } from './WebOnly/HtmlDisplay'
import {
  allJestConfigs,
  allJestTestNames,
  JestConfigForName,
  JestTestNameUtils,
  JestTestName,
} from './WebOnly/ZTestExamples'
import { ZGridTestRunner } from './Zest/ZGridRunner'
import { CreateZTestsStore, ZTest, ZTestResult } from './Zest/ZTest'

const gridRunner = new ZGridTestRunner(
  new GridData({ rowCount: 6, colCount: 6 }),
  new JestTestNameUtils(),
  CreateZTestsStore()
)
exec()

function exec() {
  const appRoot = document.getElementsByClassName('testResults').item(0)
  const buttonsGroup = document.getElementsByClassName('btn-group').item(0)
  const gridRoot = document.getElementsByClassName('grid').item(0)
  const localStorageKey = 'currentName'

  if (!appRoot || !buttonsGroup || !gridRoot) {
    throw new Error('Main HTML does not include required classes')
  }

  gridRunner.setTestRunner((testName: string, test: ZTest) => {
    const jestConfig = JestConfigForName(testName as any)
    jestConfig.runZestTest(test, false)

    localStorage.setItem(localStorageKey, testName)
  })

  gridRunner.setListener((isCurrentTest: boolean, testResult?: ZTestResult) => {
    updateHTML(
      gridRunner,
      buttonsGroup,
      appRoot,
      gridRoot,
      isCurrentTest,
      testResult
    )
  })

  const storedName = localStorage.getItem(localStorageKey) as JestTestName
  const currentName = allJestConfigs[storedName]
    ? storedName
    : allJestTestNames[0]
  gridRunner.runTestWithName(currentName)

  document.onkeydown = function (e) {
    switch (e.key) {
      case 'ArrowUp':
        gridRunner.selectDirection('up')
        break
      case 'ArrowDown':
        gridRunner.selectDirection('down')
        break
      case 'ArrowRight':
        gridRunner.selectDirection('right')
        break
      case 'ArrowLeft':
        gridRunner.selectDirection('left')
        break
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
}

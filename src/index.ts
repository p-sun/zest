import { GridData } from './HorizonUtils/GridData'
import { updateHTML } from './WebOnly/HtmlDisplay'
import { WebMain } from './WebOnly/WebMain'

const webMain = new WebMain(new GridData({ rowCount: 6, colCount: 6 }))
exec()

function exec() {
  const appRoot = document.getElementsByClassName('testResults').item(0)
  const buttonsGroup = document.getElementsByClassName('btn-group').item(0)
  const gridRoot = document.getElementsByClassName('grid').item(0)

  if (!appRoot || !buttonsGroup || !gridRoot) {
    throw new Error('Main HTML does not include required classes')
  }

  webMain.setListener((testResult) => {
    updateHTML(webMain, buttonsGroup, appRoot, gridRoot, testResult)
  })
  webMain.start()

  document.onkeydown = function (e) {
    switch (e.key) {
      case 'ArrowUp':
        webMain.selectDirection('up')
        break
      case 'ArrowDown':
        webMain.selectDirection('down')
        break
      case 'ArrowRight':
        webMain.selectDirection('right')
        break
      case 'ArrowLeft':
        webMain.selectDirection('left')
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

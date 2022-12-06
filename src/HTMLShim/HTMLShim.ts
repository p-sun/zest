import { TestResult } from '../Zest/IZTest'

export function displayTextOnHTML(result: TestResult, prependString: string) {
  function replaceBreaksForConsoleLog(text: string): string {
    return text.replace(new RegExp('<br>', 'g'), '\n')
  }

  function replaceColorsForHTML(text?: string): string {
    return (text ?? '')
      .replace(new RegExp('<color=#f00>', 'g'), '<text style="color:red;">')
      .replace(new RegExp('<color=#0f0>', 'g'), '<text style="color:green;">')
      .replace(new RegExp('<color=#ff0>', 'g'), '<text style="color:orange;">')
      .replace(new RegExp('</color>', 'g'), '</text>')
  }

  console.log(prependString + '\n\n')
  console.log(replaceBreaksForConsoleLog(result.text1Str) + '\n\n')
  console.log(replaceBreaksForConsoleLog(result.text1Str))

  let output = document.getElementById('app')
  if (output) {
    output.innerHTML = prependString + '<br><br>'
    output.innerHTML += replaceColorsForHTML(result.text1Str) + '<br><br>'
    output.innerHTML += replaceColorsForHTML(result.text2Str)
  }
}

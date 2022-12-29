import { CharForPassStatus } from './GridData'

/* -------------------------------------------------------------------------- */
/*                             Zest Horizon Readme                            */
/* -------------------------------------------------------------------------- */
function wrapTags(s: string): string {
  return `<mspace=2em>${s} - </mspace>`
}
const legendText = `<align=left>${wrapTags('-')}Unstarted
${wrapTags(CharForPassStatus('RUNNING'))}Running
${wrapTags(CharForPassStatus('PASS'))}Pass
${wrapTags(CharForPassStatus('FAIL'))}Fail
${wrapTags(CharForPassStatus('WARN'))}Warn
${wrapTags(CharForPassStatus('INVALID'))}Invalid`

const legendStrWithBreaks = WrapTextWithWidth(-1, legendText)

/* -------------------------------------------------------------------------- */
/*                                 WrapText.ts                                */
/* -------------------------------------------------------------------------- */

function WrapTextWithWidth(wrapWidth: number, str: string): string {
  if (wrapWidth < 1) {
    return str.replace(new RegExp('\n', 'g'), '<br>')
  }

  const strWithBreaks = str
    .replace(new RegExp('<br>', 'g'), '#BREAK#')
    .replace(new RegExp('\n', 'g'), ' ')
    .replace(new RegExp('\t', 'g'), ' ')

  const lines = strWithBreaks.split('#BREAK#')

  let result = ''
  let charCountOnLine = 0
  for (const line of lines) {
    charCountOnLine = 0
    const words = line.split(' ')
    for (const word of words) {
      if (word.length > 0) {
        if (word.length >= wrapWidth) {
          result += '<br>' + word + '<br>'
          charCountOnLine = 0
        } else if (charCountOnLine + word.length > wrapWidth) {
          result += '<br>' + word
          charCountOnLine = word.length
        } else {
          result += (charCountOnLine > 0 ? ' ' : '') + word
          charCountOnLine += word.length
        }
      }
    }
    result += '<br>'
  }

  return result
}

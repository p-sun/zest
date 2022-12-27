/* -------------------------------------------------------------------------- */
/*                             Zest Horizon Readme                            */
/* -------------------------------------------------------------------------- */

const myTextToWrap = `
Zest Testing Framework
<br><br><br>
This world showcases how to use Zest to easily write and automate tests.
Zest testing is declarative, meaning each test declares
 "I expect these to be true" in code blocks or TS, and Zest handles the rest.<br>

<br>
In this world there are three code block scripts (LEFT, MID, RIGHT). Each script fully encapsulates one test.
Each code block script sends and receives events from Zest.
<br><br>
LEFT shows a passing test, that tests that an object passing through a Trigger calls
the "TriggerEnter" and "TriggerExit" code blocks.
<br><br>
MID and RIGHT shows what Zest displays if the Triggers were broken in Horizon.`

const myTextNotToWrap = `The LEFT code block script is an example 
of how to write a test with Zest.

When world is started:
-- // "My test has this name, I respond to "runTest" event, 
-- // and update this Text Gizmo with test results.
-- zest.registerTest(testName, self, text)

When "runTest" event is received:
-- // Start test, where this is frame 0
-- zest.startTest(testName)

-- // After 4 seconds, if Zest is still waiting for events, fail the test.
-- zest.finishTestDelay(testName, 4)

-- // I expect a "TriggerEnter" and "TriggerExit" event to occur:
-- zest.expectEvent(testName, "TriggerEnter") 
-- zest.expectEvent(testName, "TriggerExit") 

When trigger is entered by obj:
-- zest.detectEvent(testName, "TriggerEnter")

When trigger is exited by obj:
-- zest.detectEvent(testName, "TriggerExit")`

const str = WrapTextWithWidth(45, myTextToWrap)
const str2 = WrapTextWithWidth(-1, myTextNotToWrap)

// console.log('str:\n' + str.replace(new RegExp('<br>', 'g'), '\n'))
// console.log('str2:\n' + str.replace(new RegExp('<br>', 'g'), '\n'))

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

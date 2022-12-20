/* --------------------------- Private Zest Utils --------------------------- */

type TestName = string
type TestNamePlusKey = string

const delimitor = '###'

function SplitTestNamePlusKey(
  testNamePlusKey: TestNamePlusKey,
  sourceFunction: string
):
  | {
      testName: TestName
      key: string
    }
  | undefined {
  const [testName, key] = testNamePlusKey.split(delimitor)
  if (key && key !== '') {
    return { testName, key }
  }
  console.log(
    `Error: ${sourceFunction} event expected first param to have '###'. i.e. 'testName###key'. Got: '${testNamePlusKey}'`
  )
}

function JoinTestNamePlusKey(testName: TestName, key: string): TestNamePlusKey {
  return testName + delimitor + key
}

// {testName: 'AAA', key: 'BBB'}
console.log('******* 0 ', SplitTestNamePlusKey('AAA###BBB', 'myFunction'))

// undefined
console.log('******* 1 ', SplitTestNamePlusKey('AAA##BBB', 'myFunction'))

// undefined
console.log('******* 2 ', SplitTestNamePlusKey('AAA###', 'myFunction'))

// undefined
console.log('******* 3 ', SplitTestNamePlusKey('AAA', 'myFunction'))

// 'AAA###VVV'
console.log('******* 4', JoinTestNamePlusKey('AAA', 'VVV'))

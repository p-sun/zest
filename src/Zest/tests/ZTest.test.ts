import { CreateZTest, ZTest } from '../ZTest'
import {
  JestTestName,
  JestConfigForName,
  allJestTestNames,
} from './ZTestExamples'

const runJestTest = (testName: JestTestName) => {
  const config = JestConfigForName(testName)
  describe(config.describe, () => {
    it(config.it, () => {
      const zestTest: ZTest = CreateZTest(testName)
      config.runZestTest(zestTest, true)
    })
  })
}

for (const jestTestName of allJestTestNames) {
  runJestTest(jestTestName)
}

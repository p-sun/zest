import { ZTest } from '../ZTest'
import { ZTestImpl } from '../ZTestImpl'
import {
  JestTestName,
  JestConfigForName,
  allJestTestNames,
} from './ZTestExamples'

const runJestTest = (testName: JestTestName) => {
  const config = JestConfigForName(testName)
  describe(config.describe, () => {
    it(config.it, () => {
      const zestTest: ZTest = new ZTestImpl(testName)
      config.runZestTest(zestTest, true)
    })
  })
}

for (const jestTestName of allJestTestNames) {
  runJestTest(jestTestName)
}

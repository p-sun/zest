# Zest

A Jest-like testing framework for testing lifecycles.

[![How to use Zest for Horizon Worlds](https://img.youtube.com/vi/TarGOtVGfqw/0.jpg)](https://www.youtube.com/watch?v=TarGOtVGfqw)

## What is Zest?

Zest is a testing framework that simplifies asynchronous lifecycle testing in web apps and games.

Zest allows automated tests to be easy to read and write, and able to catch more issues correctly. Tests written with Zest are short and simple because they call Zest’s APIs for declarative assertions, so that tests can be completely stateless. This is especially useful for testing complex lifecycles.

Zest manages the logic of expectations of each test, decides if the test passed or failed, and displays the test results. Tests pass events to and from Zest. Zest asserts events are received in the correct order the correct number of times, and the values are correct.

## Benefits of Zest over other testing frameworks

Zest has declarative APIs inspired by Jest and is simplified to work in more limited environments.

- No npm setup needed. Simply paste ZTest.ts into your project.
- Multiple tests can run simultaneously on one Zest instance.
- The only reference tests need is to the Zest instance. Tests do not need pass references, callbacks, or use the result to any Zest APIs.

## Guiding Principles of Zest

### 1. Tests are accurate

- Test event lifecycles accurately – Tests fail when events occur in the wrong order or the wrong number of times.
- Tests can be fully stateless – Zest tracks state so that tests do not need to. This minimizes bugs in the tests and allows people to write clearer tests with fewer lines.
- Zest itself is unit tested – I tested Zest using Jest and a web interface, making the development of Zest quick and reliable since most of it has no dependency on Horizon.

### 2. Tests are easy to read and write

- Write tests easily – Most tests can be a single short script.
- Understand tests easily – Zest outputs the order of events and which asserts failed, so readers understand the test without reading the code blocks script.
- View results anywhere – Zest outputs text, which can be viewed in VR, desktop, or passed into automated Gauntlet tests. QA can take photos of the results to validate tests.
- Test complex lifecycles – Zest can test complex multi-event lifecycles with many assertions for each step. This makes each test high quality and reduces the total number of tests. Zest is compatible with code blocks and TS.
- Track frame data – Zest outputs which frame each event occurred, this is especially useful for catching performance regressions and testing networked features.

### 3. Tests are performant

- Minimize updates - Test results are calculated once per frame. Listeners of test results only get callbacks as needed.
- Parallelize tests - Multiple tests can run at the same time.

## How to Contribute

Use `npm start` to run, and `npm test` to validate the Jest tests that tests Zest.

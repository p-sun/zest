import { ZTestResult } from './Zest/ZTest'
import { createZestTest } from './Zest/ZTest'
import {
  JestTestName,
  JestConfigForName,
  allJestTestNames,
  allJestConfigs,
} from './Zest/tests/ZTestExamples'

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
  result: ZTestResult
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
  element.innerHTML += '<br><br>' + replaceColorsForHTML(result.text)
}

class Main {
  private readonly localStorageKey = 'currentName'
  public currentName: JestTestName
  public currentTestId: string = ''

  constructor(public appRoot: Element, public buttonsGroup: Element) {
    const storedName = localStorage.getItem(
      this.localStorageKey
    ) as JestTestName

    this.currentName = allJestConfigs[storedName]
      ? storedName
      : allJestTestNames[0]
    this.selectName(this.currentName)
  }

  selectName(name: JestTestName) {
    this.currentName = name
    localStorage.setItem(this.localStorageKey, this.currentName)

    this.runHTMLTest(this.appRoot, name)

    displayButtonsOn(
      this.buttonsGroup,
      this.currentName,
      allJestTestNames,
      (jestName: JestTestName) => {
        this.selectName(jestName)
      }
    )
  }

  selectPrevious() {
    const newIndex = allJestTestNames.indexOf(this.currentName) - 1
    if (newIndex >= 0) {
      this.selectName(allJestTestNames[newIndex])
    }
  }

  selectNext() {
    const newIndex = allJestTestNames.indexOf(this.currentName) + 1
    if (newIndex < allJestTestNames.length) {
      this.selectName(allJestTestNames[newIndex])
    }
  }

  private runHTMLTest(element: Element, jestTestName: JestTestName) {
    const jestConfig = JestConfigForName(jestTestName)
    const prependString = jestConfig.describe + '<br>> ' + jestConfig.it

    const zestTest = createZestTest(jestTestName)
    this.currentTestId = zestTest.testId
    zestTest.addResultListener((testResult: ZTestResult) => {
      if (testResult.testId === this.currentTestId) {
        diplayTestResultOn(element, prependString, testResult)
      }
    })
    jestConfig.runZestTest(zestTest, false)
  }
}

const appRoot = document.getElementsByClassName('testResults').item(0)
const buttonsGroup = document.getElementsByClassName('btn-group').item(0)
if (!appRoot || !buttonsGroup) {
  throw new Error(
    'Main HTML does not include testResults and btn-group classes'
  )
}

const main = new Main(appRoot, buttonsGroup)
document.onkeydown = function (e) {
  switch (e.key) {
    case 'ArrowUp':
      main.selectPrevious()
      break
    case 'ArrowDown':
      main.selectNext()
      break
  }
}

 
function magic(data: { count: number }) {}

// As expected
// 'random' does not exist in type '{ count: number; }
magic({ count: 7, random: 6 })

// const c1: {
//   count: number
//   random: number
// }
const c1 = { count: 7, random: 6 }
// const c2: {
//   readonly count: 7
//   readonly random: 6
// }
const c2 = { count: 7, random: 6 } as const
magic(c1)
magic(c2)

// It's true!!!
type Q6 = { count: number; random: number } extends { count: number }
  ? true
  : false

// class Vec2 {
//   constructor(x: number, y: number) {}
//   static fromXY(bag: { x: number; y: number }) {
//     return new Vec2(bag.x, bag.y)
//   }
// }

function fromXY(bag: { x: number; y: number }) {}

// Object literal may only specify known properties, 
// and 'button' does not exist in type '{ x: number; y: number; }'
const notOk = fromXY({ button: 'left', isDown: true, x: 1000, y: 780 });

const m = { button: 'left', isDown: true, x: 1000, y: 780 };
const ok = fromXY(m);

type Indexable = {
  length: number;
  at: (index: number) => unknown;
};

function getMiddleValue(provider: Indexable) {
  return provider.at(Math.floor(provider.length / 2));
}

const u: Array<number> = null as any;



type Extends<A, B> = [A] extends [B] ? true : false
type Answer = number extends number[] ? true : false

type Pair<S, T> = [S, T] // aka. tuple. aka "array with fixed number of 2"
type NumberBool = Pair<number, boolean>
const f: NumberBool = [8, true]

type StringToNumberBag = { [key: string]: number }
type StringToNumberBag2 = Record<string, number>

type Person = {
  name: string
  age: number
  likesDogs: boolean
}

// type KeysOfPerson = 'name' | 'age' | 'likesDogs'
type PersonKeys = keyof Person

// type PersonButAllValuesAreNumbers = {
//   name: number
//   age: number
//   likesDogs: number
// }
type PersonButAllValuesAreNumbers = {
  [key in PersonKeys]: number
}

// type TypeOfLikesDogs = boolean
type TypeOfLikesDogs = Person['likesDogs']

// Same type as Person
type Person2 = {
  [key in PersonKeys]: Person[key]
}

type PersonKeysWithoutId = keyof Person extends 'id' ? 

// type Thing<A> = A extends number ? 'a' : 'b'
// // type It = 'a' | 'b'
// type It = Thing<number | boolean>

// type Thing2<A> = [A] extends [number] ? 'a' : 'b'
// // type It2 = "b"
// type It2 = Thing2<number | boolean>


// - distribute though thte union types

// type ElementOf<T> = null

// contraint 
// predicate
// infer is a keyword than can be used in exteneds predicate
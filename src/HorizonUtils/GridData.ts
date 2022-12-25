import { ZTestStatus } from '../Zest/ZTest'

/* -------------------------------------------------------------------------- */
/*                         Specific to Collision World                        */
/* -------------------------------------------------------------------------- */

export const myGridSize: GridSize = { rowCount: 18, colCount: 18 * 2 }

export function CharLabelForRow(row: number) {
  return CharLabelForIndex(row, 18, true) // Uppercase First
}

export function CharLabelForColumn(row: number) {
  return CharLabelForIndex(row, 18, true) // Lowercase First
}

/* -------------------------------------------------------------------------- */
/*                           GridData + Zest                                  */
/* -------------------------------------------------------------------------- */

export function CharForPassStatus(passStatus: string): string | undefined {
  const status = <ZTestStatus['passStatus']>passStatus
  switch (status) {
    case 'RUNNING':
      return '~'
    case 'PASS':
      return 'O'
    case 'FAIL':
      return `X`
    case 'WARN':
      return 'n'
    case 'INVALID':
      return 'i'
    case 'CANCEL':
      return 'c'
  }
}

/* -------------------------------------------------------------------------- */
/*                                 GridData.ts                                */
/* -------------------------------------------------------------------------- */

export type GridSize = {
  rowCount: number
  colCount: number
}

export type CellPosition = {
  row: number
  column: number
}

export function CellPositionEqual(a: CellPosition, b: CellPosition) {
  return a.row === b.row && a.column === b.column
}

export function IndexForCellPosition(cellPos: CellPosition, size: GridSize) {
  return cellPos.row * size.colCount + cellPos.column
}

export function CellPositionForIndex(
  index: number,
  size: GridSize
): CellPosition {
  return {
    row: Math.floor(index / size.colCount),
    column: Math.floor(index % size.colCount),
  }
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export class GridData {
  private gridData: string[][] = []
  private selectedPos: CellPosition = { row: 0, column: 0 }

  constructor(public size: GridSize) {
    this.gridData = Array(size.rowCount)
      .fill(null)
      .map(() => Array(size.colCount).fill('-'))
  }

  get selectedCellPos() {
    return Object.assign({}, this.selectedPos)
  }

  selectCellPosition(cellPos: CellPosition) {
    this.selectedPos = cellPos
  }

  moveSelectedCellPosIn(direction: Direction) {
    this.selectedPos = this._cellPosForDirection(direction)
  }

  setCharAt(cellPos: CellPosition, char: string) {
    this.gridData[cellPos.row][cellPos.column] = char
  }

  getText(isHorizon: boolean = true): string {
    let str = '<align=left><mspace=4.8em><mark=#00000000>'
    const twoSpaces = isHorizon ? '  ' : '..'
    str += twoSpaces + this._columnHeaders(isHorizon)
    // Add an extra char to account for the '|' at the end
    // of other lines, since Horizon Text is center aligned
    str += '<color=#00000000>.</color>'
    str += '<br><br>'

    this.forEachCell((cellPos) => {
      if (cellPos.column === 0) {
        const label = CharLabelForRow(cellPos.row)
        const isSelectedRow = cellPos.row === this.selectedPos.row
        const gridLabelWTags = isSelectedRow
          ? this._yellowTextTags(label, isHorizon)
          : label
        str += '<br>' + gridLabelWTags + '|'
      }

      const cellDataChar = this.gridData[cellPos.row][cellPos.column]

      const isSelectedCell = CellPositionEqual(cellPos, this.selectedPos)
      if (isSelectedCell) {
        str += this._yellowHighlightTags(cellDataChar, isHorizon)
      } else {
        str += cellDataChar
      }

      if (cellPos.column === this.size.colCount - 1) {
        str += '|'
      }
    })
    return str
  }

  private _cellPosForDirection(direction: Direction): CellPosition {
    const row = this.selectedPos.row
    const column = this.selectedPos.column
    const rowCount = this.size.rowCount
    const colCount = this.size.colCount
    switch (direction) {
      case 'up':
        return { row: (row + rowCount - 1) % rowCount, column }
      case 'down':
        return { row: (row + 1) % rowCount, column }
      case 'left':
        return {
          row: column === 0 ? (row + rowCount - 1) % rowCount : row,
          column: (column + colCount - 1) % colCount,
        }
      case 'right':
        return {
          row: column === colCount - 1 ? (row + 1) % rowCount : row,
          column: (column + 1) % colCount,
        }
    }
  }

  private forEachCell(fn: (cellPos: CellPosition) => void) {
    for (let row = 0; row < this.size.rowCount; row++) {
      for (let column = 0; column < this.size.colCount; column++) {
        fn({ row, column })
      }
    }
  }

  private _columnHeaders(isHorizon: boolean) {
    let { column } = this.selectedPos
    let columnNames = ''
    for (let i = 0; i < this.size.colCount; i++) {
      const columnLabel = CharLabelForColumn(i)
      columnNames +=
        column === i
          ? this._yellowTextTags(columnLabel, isHorizon)
          : columnLabel
    }
    return columnNames
  }

  private _yellowHighlightTags(str: string, isHorizon: boolean) {
    const openTag = isHorizon ? '<mark=#ffff0088>' : `<mark>`
    const closeTag = isHorizon ? '<mark=#00000000>' : '</mark>'
    return openTag + str + closeTag
  }

  private _yellowTextTags(str: string, isHorizon: boolean) {
    const openTag = isHorizon
      ? '<color=#ffff00>'
      : `<text style="color:yellow">`
    const closeTag = isHorizon ? '</color>' : '</text>'
    return openTag + str + closeTag
  }
}

/* -------------------------------------------------------------------------- */
/*                             GridData Text Utils                            */
/* -------------------------------------------------------------------------- */

// Returns single readable char representation of an number:
// [a-z][A-Z], for a max of 52 characters
/*
CharLabelForIndex(0, 26) // a
CharLabelForIndex(25, 26) // z
CharLabelForIndex(26, 26) // A
CharLabelForIndex(26 * 2 - 1, 26) // Z
CharLabelForIndex(52, 26) // +
CharLabelForIndex(0, 18) // a
CharLabelForIndex(1, 18) // b
CharLabelForIndex(17, 18) // r
CharLabelForIndex(18, 18) // A
CharLabelForIndex(18 * 2 - 1, 18) // R
 */
function CharLabelForIndex(
  n: number,
  restartLettersAtN: number,
  lowercaseFirst: boolean = false
) {
  if (n >= restartLettersAtN * 2) {
    console.log(`ERROR: expected n < restartAt. 
      Got n:${n}, restartAtN: ${restartLettersAtN}`)
    return '+'
  }

  const firstA = lowercaseFirst ? 97 : 65
  const secondA = lowercaseFirst ? 65 : 97
  return n < restartLettersAtN
    ? String.fromCharCode(firstA + n)
    : String.fromCharCode(secondA + n - restartLettersAtN)
}

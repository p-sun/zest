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

export function CharLabelForRow(row: number) {
  return String.fromCharCode(65 + row) // Uppercase
}

export function CharLabelForColumn(n: number) {
  return n > 17 ? String.fromCharCode(65 + n) : String.fromCharCode(97 + n)
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
    if (char.length === 1) {
      this.gridData[cellPos.row][cellPos.column] = char
    } else {
      console.log(
        `ERROR in setCharAt: expected 1 char value, but got ${char}, which has length of ${char.length}`
      )
    }
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
    const openTag = isHorizon
      ? '<mark=#ffff0088>'
      : `<text style="color:yellow">`
    const closeTag = isHorizon ? '<mark=#00000000>' : '</text>'
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

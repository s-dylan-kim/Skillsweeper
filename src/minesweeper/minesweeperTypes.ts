export enum TileState {
    safe,
    dangerous,
    unknown
}

export type TileProps = {
    revealed: boolean,
    flagged: boolean,
    value: number, // -1 for bomb, 0 - 8 for number displayed on tile
    highlight: number // 0 for nothing, 1 for red, 2 for green
}

export type populateValidityStackInfo = {
    row: number,
    col: number,
    val: number // -3 for unassigned, -1 for bomb, 0 - 8 for number displayed on tile
}

export type configurationInfo = {
    board: number[][],
    bombCount: number // store bomb count, to solve potential future edge cases
}
export enum TileState {
    safe,
    dangerous,
    unknown
}

export type TileProps = {
    revealed: boolean,
    state: TileState,
    flagged: boolean,
    value: number // -1 for bomb, 0 - 8 for number displayed on tile
}
export enum TileState {
    safe,
    dangerous,
    unknown
}

export type TileProps = {
    revealed: boolean,
    state: TileState,
    flagged: boolean
}
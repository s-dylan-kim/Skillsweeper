import React, { useState, useEffect } from "react";

import { TileState, TileProps } from "./tileTypes.ts";
import MinesweeperTile from "./minesweeperTile.tsx";
import "./minsweeper.css";

const BOARDLENGTH = 10;
const BOARDWIDTH = 10;

export default function Minesweeper() {
    const [board, setBoard] = useState<TileProps[]>([]);
    const [boardLength, setBoardLength] = useState(BOARDLENGTH);
    const [boardWidth, setBoardWidth] = useState(BOARDWIDTH);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        let initBoard:TileProps[] = [];
        for (let i = 0; i < boardLength; i++) {
            for (let j = 0; j < boardWidth; j++) {
                initBoard = [...initBoard, {revealed: false, state: TileState.unknown, flagged: false}];
            }
        }
        setBoard(initBoard);
    }, []);

    return (
        <div>
            <div id="minesweeper-board">
                {board.map((tileprops, index) => {
                    return(
                        <MinesweeperTile key={index} {...tileprops} onClick={() => handleTileClick(index)}/>
                    );
                })}
            </div>
        </div>
    );

    function handleTileClick(index: number) {
        if (!gameStarted) {

        }
    }

    // function handleGameStart(index: number) {

    // }
}
  
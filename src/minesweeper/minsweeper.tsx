import React, { useState, useEffect } from "react";

import { TileState, TileProps } from "./tileTypes.ts";
import MinesweeperTile from "./minesweeperTile.tsx";
import Modal from "./modal.tsx"
import "./minsweeper.css";

const BOARDHEIGHT = 16;
const BOARDWIDTH = 16;
const NUMBOMBS = 40;
const BOMBVALUE = -1;
const MAXBOARDHEIGHT = 32;
const MAXBOARDWIDTH = 32;
const MINIMUMEMPTYTILES = 9;

export default function Minesweeper() : JSX.Element {
    const [board, setBoard] = useState<TileProps[][]>([]);
    const [boardHeight, setBoardHeight] = useState(BOARDHEIGHT);
    const [boardWidth, setBoardWidth] = useState(BOARDWIDTH);
    const [gameStarted, setGameStarted] = useState(false);
    const [numBombs, setNumBombs] = useState(NUMBOMBS);
    const [revealedCount, setRevealedCount] = useState(0);
    const [flagCount, setFlagCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        resetBoard();
    }, []);

    useEffect(() => {
        resetGame();
    }, [numBombs, boardWidth, boardHeight])

    return (
        <>
            <Modal showModal={showModal} gameWon={gameWon} revealedCount={revealedCount} totalTiles={boardWidth * boardHeight - numBombs} showHelp={showHelp} buttonOnClick={showHelp ? () => setShowModal(false) : () => resetGame()}/>

            <div id="minesweeper-wrapper">
                <div id="minesweeper-board" onContextMenu={(e) => e.preventDefault()}> {/* prevent accidental right clicks between cells */}
                    {board.map((tilerows, row) => {
                        return (
                            <div key={-row} className="minesweeper-board-row">
                                {tilerows.map((tileprops, col) => <MinesweeperTile key={row * boardWidth + col} {...tileprops} onClick={() => handleTileClick(row, col)} onContextMenu={(e) => handleRightClick(e, row, col)}/>)}
                            </div>
                        )                        
                    })}
                </div>
                <div id="minesweeper-settings">
                    <div className="minesweeper-setting-row">
                        <div className="minesweeper-setting-info">
                            Bombs Left:
                        </div>
                        <div className="minesweeper-setting-info">
                            Tiles Left:
                        </div>
                        <div className="minesweeper-setting-info">
                            Board Width:
                        </div>
                        <div className="minesweeper-setting-info">
                            Board Height:
                        </div>
                        <div className="minesweeper-setting-info">
                            Bomb Count:
                        </div>
                    </div>
                    <div className="minesweeper-setting-row">
                        <div className="minesweeper-setting-info">
                            {numBombs - flagCount}
                        </div>
                        <div className="minesweeper-setting-info">
                            {boardWidth * boardHeight - numBombs - revealedCount}
                        </div>
                        <div className="minesweeper-setting-info">
                            <input
                                className="minesweeper-setting-input"
                                value = {boardWidth}
                                onChange= {
                                    e => {
                                        if (!isNaN(+e.target.value)) {
                                            let newWidth = Math.floor(+e.target.value);
                                            if (+e.target.value > MAXBOARDWIDTH) newWidth = MAXBOARDWIDTH;
                                            setBoardWidth(newWidth);
                                        }
                                    }
                                }
                            />
                        </div>
                        <div className="minesweeper-setting-info">
                            <input
                                className="minesweeper-setting-input"
                                value = {boardHeight}
                                onChange= {
                                    e => {
                                        if (!isNaN(+e.target.value)) {
                                            let newHeight = Math.floor(+e.target.value);
                                            if (+e.target.value > MAXBOARDHEIGHT) newHeight = MAXBOARDHEIGHT;
                                            setBoardHeight(newHeight);
                                        }
                                    }
                                }
                            />
                        </div>
                        <div className="minesweeper-setting-info">
                            <input
                                className="minesweeper-setting-input"
                                value = {numBombs}
                                onChange= {
                                    e => {
                                        if (!isNaN(+e.target.value)) {
                                            let newBombs = Math.floor(+e.target.value);
                                            if (+e.target.value > boardWidth * boardHeight - 9) newBombs = boardWidth * boardHeight - MINIMUMEMPTYTILES;
                                            setNumBombs(newBombs);
                                        }
                                    }
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // pass reference of array to reduce number of copys
    // dfs floodfill to reveal all 0s
    function revealTile (boardCopy: TileProps[][], row: number, col: number) : void {
        if (boardCopy[row][col].revealed) return;

        setRevealedCount((revealedCount) => revealedCount + 1); // have to pass a function because of update batching
        boardCopy[row][col].revealed = true;

        if (boardCopy[row][col].value === 0) {
            for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) {
                for (let adjacentCol = col - 1; adjacentCol <= col + 1; adjacentCol++) {
                    if (
                        adjacentRow >= 0 && adjacentRow < boardHeight && // ensure row bound
                        adjacentCol >= 0 && adjacentCol < boardWidth && // ensure col bound
                        !boardCopy[adjacentRow][adjacentCol].revealed // ensure not revealed already
                    ) {
                        revealTile(boardCopy, adjacentRow, adjacentCol);
                    }
                }
            }
        }
    }

    function handleRightClick(e: React.MouseEvent, row: number, col: number) : void {
        e.preventDefault();
        let boardCopy = [...board];
        setFlagCount(flagCount + (board[row][col].flagged ? -1 : 1));

        boardCopy[row][col].flagged = !boardCopy[row][col].flagged;
        setBoard(boardCopy);
    }

    function handleTileClick(row: number, col: number) : void {
        if (board[row][col].flagged) return; // dont allow flagged tile to be revealed

        if (!gameStarted) {
            handleGameStart(row, col);
        }
        
        let boardCopy = [...board];

        // check for loss
        if (board[row][col].value === BOMBVALUE) {
            boardCopy[row][col].revealed = true;
            setBoard(boardCopy);
            setGameWon(false);
            setShowModal(true);
            return;
        }

        revealTile(boardCopy, row, col);

        // check for win
        if (revealedCount + numBombs === boardWidth * boardHeight) {
            setGameWon(true);
            setShowModal(true);
            return;
        }

        setBoard(boardCopy);
    }

    function resetGame(): void {
        setShowModal(false);
        setGameStarted(false);
        setGameWon(false);
        setShowHelp(false);
        setRevealedCount(0);
        resetBoard();
    }

    function resetBoard(): void {
        let initBoard:TileProps[][] = [];
        for (let i = 0; i < boardHeight; i++) {
            let initRow:TileProps[] = [];
            for (let j = 0; j < boardWidth; j++) {
                initRow = [...initRow, {revealed: false, state: TileState.unknown, flagged: false, value: 0}];
            }
            initBoard = [...initBoard, initRow];
        }
        setBoard(initBoard);
    }

    function handleGameStart(row: number, col: number) : void {
        let boardCopy = [...board];

        for (let bombsPlaced = 0; bombsPlaced < numBombs;) {
            let proposedRow = Math.floor(Math.random() * boardHeight);
            let proposedCol = Math.floor(Math.random() * boardWidth);

            if (boardCopy[proposedRow][proposedCol].value === BOMBVALUE) continue; // reroll if bomb already there

            if ( // assure that no bombs are adjacent to starting location
                !(proposedRow >= row - 1 && proposedRow <= row + 1) ||
                !(proposedCol >= col - 1 && proposedCol <= col + 1)
            ) {
                boardCopy[proposedRow][proposedCol].value = BOMBVALUE;
                bombsPlaced++;
            }
        }

        setBoard(boardCopy);
        updateCellValues();
        setGameStarted(true);
    }

    function updateCellValues() : void {
        let boardCopy = [...board];

        for (let row = 0; row < boardHeight; row++) { // clear out all old number values
            for (let col = 0; col < boardWidth; col++) {
                if (boardCopy[row][col].value !== BOMBVALUE) boardCopy[row][col].value = 0; // reset values
            }
        }

        for (let row = 0; row < boardHeight; row++) { // iterate through every node looking for bombs
            for (let col = 0; col < boardWidth; col++) {
                if (boardCopy[row][col].value === BOMBVALUE) { // if bomb, iterate through 3x3 centered on bomb
                    for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) {
                        for (let adjacentCol = col - 1; adjacentCol <= col + 1; adjacentCol++) {
                            if (
                                !(adjacentRow === row && adjacentCol === col) && // ensure we arnt adding to the bomb tile
                                adjacentRow >= 0 && adjacentRow < boardHeight && // ensure row bound
                                adjacentCol >= 0 && adjacentCol < boardWidth && // ensure col bound
                                boardCopy[adjacentRow][adjacentCol].value !== BOMBVALUE
                            ) {
                                boardCopy[adjacentRow][adjacentCol].value++;
                            }
                        }
                    }
                }
            }
        }

        setBoard(boardCopy);
    }
}
  
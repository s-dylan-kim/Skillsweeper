import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'

import { TileState, TileProps, populateValidityStackInfo } from "./minesweeperTypes.ts";
import MinesweeperTile from "./minesweeperTile.tsx";
import Modal from "./modal.tsx"
import MinesweeperSettings from "./minesweeperSettings.tsx";
import { BOARDHEIGHT, BOARDWIDTH, NUMBOMBS, MINIMUMEMPTYTILES, BOMBVALUE, EMPTYVALUE } from "../constants.tsx"
import "./minsweeper.css";



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
        if (numBombs > boardWidth * boardHeight - MINIMUMEMPTYTILES) setNumBombs(Math.max(0, boardWidth * boardHeight - MINIMUMEMPTYTILES));
        if (numBombs < 0) setNumBombs(0);
        resetGame();
    }, [numBombs, boardWidth, boardHeight])

    // check for win using hook to avoid race condition
    useEffect(() => {
        if (revealedCount + numBombs >= boardHeight * boardWidth) {
            setGameWon(true);
            setShowModal(true);
        }
    }, [revealedCount])
    return (
        <>
            <Modal showModal={showModal} gameWon={gameWon} revealedCount={revealedCount} totalTiles={boardWidth * boardHeight - numBombs} showHelp={showHelp} buttonOnClick={showHelp ? () => setShowModal(false) : () => resetGame()}/>

            <div id="minesweeper-wrapper">
                <div id="minesweeper-wrapper-content-center">
                    <div id="minesweeper-title-card">
                        <b>Skillsweeper</b>
                        <FontAwesomeIcon icon={faCircleInfo} id="minesweeper-info-button" onClick={() => {console.log(board); setShowHelp(true); setShowModal(true);}}/>
                    </div>
                    <div id="minesweeper-board" onContextMenu={(e) => e.preventDefault()}> {/* prevent accidental right clicks between cells */}
                        {board.map((tilerows, row) => {
                            return (
                                <div key={-row} className="minesweeper-board-row">
                                    {tilerows.map((tileprops, col) => <MinesweeperTile key={row * boardWidth + col} {...tileprops} onClick={() => handleTileClick(row, col)} onContextMenu={(e) => handleRightClick(e, row, col)}/>)}
                                </div>
                            )                        
                        })}
                    </div>

                    <MinesweeperSettings numBombs={numBombs} flagCount={flagCount} boardHeight={boardHeight} boardWidth={boardWidth} revealedCount={revealedCount} setBoardWidth={setBoardWidth} setBoardHeight={setBoardHeight} setNumBombs={setNumBombs}/>
                </div>
            </div>
        </>
    );

    function flattenCoord (row: number, col: number) : number {
        return row * boardWidth + col;
    }

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

        setBoard(boardCopy);

        populateValidity();
    }

    function resetGame(): void {
        setShowModal(false);
        setGameStarted(false);
        setGameWon(false);
        setShowHelp(false);
        setRevealedCount(0);
        setFlagCount(0);
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

        boardCopy[0][0].value = BOMBVALUE;
        boardCopy[1][0].value = BOMBVALUE;
        boardCopy[0][2].value = BOMBVALUE;
        boardCopy[1][2].value = BOMBVALUE;

        for (let bombsPlaced = 4; bombsPlaced < numBombs;) {
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

    // ------------------------------------------------------------------------------------------

    function populateValidity () : void {
        let oddsBomb: number[][] = []
        let oddsSafe: number[][] = []
        for (let row = 0; row < boardHeight; row++) {
            oddsBomb[row] = [];
            oddsSafe[row] = [];
            for (let col = 0; col < boardWidth; col++) {
                oddsBomb[row][col] = 0;
                oddsSafe[row][col] = 0;

            }
        }

        const UNPLACEDVAL = -3;

        let toValidate = new Set<number>(); // we have to use flattened indexes for set (row * boardWidth + col) since js Set cant do tuples
        // add all unrevealed tiles adjacent to value to set
        for (let row = 0; row < boardHeight; row++) {
            for (let col = 0; col < boardWidth; col++) {
                if (!board[row][col].revealed) {
                    let found = false;
                    for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) {
                        for (let adjacentCol = col - 1; adjacentCol <= col + 1; adjacentCol++) {
                            if (
                                adjacentRow >= 0 && adjacentRow < boardHeight && // ensure row bound
                                adjacentCol >= 0 && adjacentCol < boardWidth && // ensure col bound
                                board[adjacentRow][adjacentCol].revealed && // ensure tile is revealed
                                board[adjacentRow][adjacentCol].value > 0 // ensure tile has number on it
                            ) {
                                found = true;
                                toValidate.add(flattenCoord(row, col));
                                break;
                            }
                        }
                        if (found) break;
                    }
                }
            }
        }

        while (toValidate.size > 0) {
            // track how many successful patterns were made
            let totalConfigs = 0;
            // track number of times bomb is at this location
            let bombTracker: number[][] = [];
            let safeTracker: number[][] = [];
            // temp board to put bombs on
            let tempBoard: number[][] = [];
            for (let row = 0; row < boardHeight; row++) {
                bombTracker[row] = [];
                tempBoard[row] = [];
                safeTracker[row] = [];
                for (let col = 0; col < boardWidth; col++) {
                    bombTracker[row][col] = 0;
                    tempBoard[row][col] = UNPLACEDVAL;
                    safeTracker[row][col] = 0;
                }
            }

            let startPoint = toValidate.values().next().value;
            let startRow = Math.floor(startPoint / boardWidth);
            let startCol = startPoint % boardWidth;

            let visitedStack: populateValidityStackInfo[] = [] // stores X coord, Y coord, value tried
            let toVisit: populateValidityStackInfo[] = []; // stores X coord, Y coord, value to try
            let inToVisit = new Set<number>();
            toVisit.push({row: startRow, col:startCol, val: BOMBVALUE});
            inToVisit.add(flattenCoord(startRow, startCol));

            while (toVisit.length > 0) {
                let toVisitVals = toVisit.pop();
                
                if (!toVisitVals) {console.log("ERROR IN POPULATE VALIDITY"); return;}

                let {row, col, val} = toVisitVals;
                toValidate.delete(flattenCoord(row, col)); // make sure we dont repeat this cell
                inToVisit.delete(flattenCoord(row, col));

                let visitCandidates: populateValidityStackInfo[] = []; // nodes to visit if this is valid
                tempBoard[row][col] = val;

                // is this placement currently valid?
                let valid = true;

                for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) {
                    for (let adjacentCol = col - 1; adjacentCol <= col + 1; adjacentCol++) { // find number tiles adjacent to current tile
                        if (
                            adjacentRow >= 0 && adjacentRow < boardHeight && // ensure row bound
                            adjacentCol >= 0 && adjacentCol < boardWidth && // ensure col bound
                            board[adjacentRow][adjacentCol].revealed && // ensure tile is revealed
                            board[adjacentRow][adjacentCol].value > 0 // ensure tile has number on it
                        ) {
                            let bombVal = board[adjacentRow][adjacentCol].value;
                            let bombCount = 0;
                            let potentialBombCount = 0;
                            for (let numberAdjacentRow = adjacentRow - 1; numberAdjacentRow <= adjacentRow + 1; numberAdjacentRow++) {
                                for (let numberAdjacentCol = adjacentCol - 1; numberAdjacentCol <= adjacentCol + 1; numberAdjacentCol++) {
                                    if (
                                        numberAdjacentRow >= 0 && numberAdjacentRow < boardHeight && // ensure row bound
                                        numberAdjacentCol >= 0 && numberAdjacentCol < boardWidth && // ensure col bound
                                        !board[numberAdjacentRow][numberAdjacentCol].revealed // ensure tile is NOT revealed
                                    ) {
                                        switch(tempBoard[numberAdjacentRow][numberAdjacentCol]) {
                                            case UNPLACEDVAL: {
                                                potentialBombCount++;
                                                if (!inToVisit.has(flattenCoord(numberAdjacentRow, numberAdjacentCol))) {
                                                    visitCandidates.push({row: numberAdjacentRow, col: numberAdjacentCol, val: BOMBVALUE})
                                                    inToVisit.add(flattenCoord(numberAdjacentRow, numberAdjacentCol))
                                                }
                                                break;
                                            }
                                            case BOMBVALUE: {
                                                bombCount++;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            if (bombCount > bombVal || bombCount + potentialBombCount < bombVal) { // check if config is not possible
                                valid = false;
                            }
                        }
                        if (!valid) break;
                    }
                    if (!valid) break;
                }

                visitCandidates.sort((a, b) => {
                    return  Math.abs(b.row - row) + Math.abs(b.col - col) - (Math.abs(a.row - row) + Math.abs(a.col - col));
                });

                visitCandidates.forEach((val : populateValidityStackInfo) => {
                    toVisit.push(val);
                });

                if (valid) {
                    visitedStack.push({row, col, val});

                    if (toVisit.length != 0) continue;
                     
                    // found a full match!
                    let tempCpy:number[][] = [];
                    for (let i = 0; i < tempBoard.length; i++) tempCpy[i] = tempBoard[i].slice();
                    for (let copyRow = 0; copyRow < boardHeight; copyRow++) {
                        for (let copyCol = 0; copyCol < boardWidth; copyCol++) {
                            bombTracker[copyRow][copyCol] += (tempBoard[copyRow][copyCol] == BOMBVALUE ? 1 : 0);
                            safeTracker[copyRow][copyCol] += (tempBoard[copyRow][copyCol] == 0 ? 1 : 0);
                        }
                    }
                    // console.log("FULL MATCH")
                    // console.log(tempCpy);
                    // console.log(JSON.stringify(visitedStack));
                    totalConfigs++;
                }

                tempBoard[row][col] = UNPLACEDVAL;
                if (val == BOMBVALUE) {
                    inToVisit.add(flattenCoord(row, col));
                    toVisit.push({row, col, val:0});
                } else {
                    inToVisit.add(flattenCoord(row, col));
                    toVisit.push({row, col, val:BOMBVALUE});
                    
                    while (visitedStack.length > 0) {
                        let visitedVal = visitedStack.pop()
                        if (visitedVal) {
                            tempBoard[visitedVal.row][visitedVal.col] = UNPLACEDVAL;
                            if (visitedVal.val == BOMBVALUE) {
                                inToVisit.add(flattenCoord(visitedVal.row, visitedVal.col));
                                toVisit.push({row: visitedVal.row, col: visitedVal.col, val: EMPTYVALUE});
                                break;
                            } else {
                                inToVisit.add(flattenCoord(visitedVal.row, visitedVal.col));
                                toVisit.push({row: visitedVal.row, col: visitedVal.col, val: BOMBVALUE});
                            }
                        }
                    }

                    if (visitedStack.length == 0 && toVisit[toVisit.length - 1].val == BOMBVALUE) break;
                }
            }

            // update odds bomb array and remove from set as we calculated its odds
            for (let row = 0; row < boardHeight; row++) {
                for (let col = 0; col < boardWidth; col++) {
                    if (bombTracker[row][col] > 0) {
                        oddsBomb[row][col] = bombTracker[row][col] / totalConfigs;
                    }
                    if (safeTracker[row][col] > 0) {
                        oddsSafe[row][col] = safeTracker[row][col] / totalConfigs;
                    }
                }
            }
            // console.log(`total configs: ${totalConfigs}`)
        }

        let boardCopy = [...board];
        // console.log(oddsBomb);
        // console.log(oddsSafe);
        for (let row = 0; row < boardHeight; row++) {
            for (let col = 0; col < boardWidth; col++) {
                if (oddsBomb[row][col] == 1) {
                    boardCopy[row][col].state = TileState.dangerous;
                }
                else if (oddsSafe[row][col] == 1) {
                    boardCopy[row][col].state = TileState.safe;
                }
                else {
                    boardCopy[row][col].state = TileState.unknown;
                }
            }
        }
        setBoard(boardCopy);
    }

    // algorithm
    // have dummy board to simulate
    // stack of nodes to visit (visit first using bomb then not bomb)
    // traceback stack of what we visited with, 1 we go back even further, 0 we try change 0 to 1
    // check if valid, check adjacent cells to see if all values are within possibility
    // if valid push neighbors onto stack
    // if exhaust toVisit stack, then save answer

    // BUG: CANT BACKTRACK IF DISCONNECT, NEED TO READD VALUE SOMEHOW
    // when teardown history, readd preemptively
    
}
  
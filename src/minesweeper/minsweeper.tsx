import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'

import { TileState, TileProps, populateValidityStackInfo } from "./minesweeperTypes.ts";
import MinesweeperTile from "./minesweeperTile.tsx";
import Modal from "./modal.tsx"
import MinesweeperSettings from "./minesweeperSettings.tsx";
import { BOARDHEIGHT, BOARDWIDTH, NUMBOMBS, MINIMUMEMPTYTILES, BOMBVALUE, EMPTYVALUE, UNPLACEDVAL } from "../constants.tsx"
import "./minsweeper.css";



export default function Minesweeper() : JSX.Element {
    const [board, setBoard] = useState<TileProps[][]>([]);
    const [boardHeight, setBoardHeight] = useState(BOARDHEIGHT);
    const [boardWidth, setBoardWidth] = useState(BOARDWIDTH);
    const [numBombs, setNumBombs] = useState(NUMBOMBS);
    const [revealedCount, setRevealedCount] = useState(0);
    const [flagCount, setFlagCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);


    /**
     * set up board on initialization
     */
    useEffect(() => {
        resetBoard();
    }, []);

    /**
     * ensure that the number bombs is within an acceptable range
     */
    useEffect(() => {
        if (numBombs > boardWidth * boardHeight - MINIMUMEMPTYTILES) setNumBombs(Math.max(0, boardWidth * boardHeight - MINIMUMEMPTYTILES));
        if (numBombs < 0) setNumBombs(0);
        resetGame();
    }, [numBombs, boardWidth, boardHeight])

    /**
     * check for win using hook to avoid race condition
     */
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

    /**
     * Converts (row, col) coords to a flattened coordinate system
     * 
     * @param row - row to convert coord
     * @param col - col to convert coord
     * @returns flattened coordinate
     */
    function flattenCoord (row: number, col: number) : number {
        return row * boardWidth + col;
    }

    /**
     * recursively reveal all tiles adjacent to a 0 tile
     * similar to DFS floodfill
     * 
     * @param boardCopy - reference of the board to change tiles to revealed for
     * @param row - row of tile being revealed
     * @param col - col of tile being revealed
     */
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

    /**
     * Handles right clicks on tiles (placing/removing flags)
     * 
     * @param e - mouse right click event
     * @param row - row of tile right clicked
     * @param col - col of tile right clicked
     */
    function handleRightClick(e: React.MouseEvent, row: number, col: number) : void {
        e.preventDefault(); // prevent right click menu from showing
        let boardCopy = [...board];
        setFlagCount(flagCount + (board[row][col].flagged ? -1 : 1));

        boardCopy[row][col].flagged = !boardCopy[row][col].flagged;
        setBoard(boardCopy);
    }

    /**
     * handles revealing a tile when a player left clicks it
     * 
     * @param row - row of tile player clicked
     * @param col - col of tile player clicked
     */
    function handleTileClick(row: number, col: number) : void {
        if (board[row][col].flagged) return; // dont allow flagged tile to be revealed

        if (!gameStarted) {
            handleGameStart(row, col);
        }

        let { possibleBoards, dangerMap, safeExists } = populateValidity();
        console.log(dangerMap);

        let boardCopy = [...board];

        if (dangerMap[row][col] === TileState.unknown) {
            if (safeExists) {
                // force loss
                if (board[row][col].value !== BOMBVALUE) {
                    changeBombLocations(possibleBoards, row, col, BOMBVALUE);
                }
                
                boardCopy[row][col].revealed = true;
                setBoard(boardCopy);
                setGameWon(false);
                setShowModal(true);
                return;
            } else {
                // force safe tile
                if (board[row][col].value === BOMBVALUE) {
                    changeBombLocations(possibleBoards, row, col, EMPTYVALUE);
                    updateCellValues();
                }
            }
        }

        revealTile(boardCopy, row, col);

        setBoard(boardCopy);
        
    }

    /**
     * resets game state to starting state
     */
    function resetGame(): void {
        setShowModal(false);
        setGameStarted(false);
        setGameWon(false);
        setShowHelp(false);
        setRevealedCount(0);
        setFlagCount(0);
        resetBoard();
    }

    /**
     * resets the board to game start state: removes all bombs, flags, and makes all tiles unreveealed
     */
    function resetBoard(): void {
        let initBoard:TileProps[][] = [];
        for (let i = 0; i < boardHeight; i++) {
            let initRow:TileProps[] = [];
            for (let j = 0; j < boardWidth; j++) {
                initRow = [...initRow, {revealed: false, flagged: false, value: 0}];
            }
            initBoard = [...initBoard, initRow];
        }
        setBoard(initBoard);
    }

    /**
     * Handles game start functions: placing bombs and assigning number values to empty cells
     * 
     * @param row - row of cell the player clicked when starting the game
     * @param col - col of cell the player clicked when starting the game
     */
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

    /**
     * Updates the number values in cells to reflect the number of mines adjacent to them
     */
    function updateCellValues() : void {
        let boardCopy = [...board];

        for (let row = 0; row < boardHeight; row++) { // clear out all old number values
            for (let col = 0; col < boardWidth; col++) {
                if (boardCopy[row][col].value !== BOMBVALUE) boardCopy[row][col].value = 0;
            }
        }

        for (let row = 0; row < boardHeight; row++) { // iterate through every node looking for bombs
            for (let col = 0; col < boardWidth; col++) {
                if (boardCopy[row][col].value === BOMBVALUE) { // if bomb, iterate through 3x3 centered on bomb and add 1 to number tiles adjacent to it
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

    /**
     * returns whether each tile is guarenteed safe, guarenteed dangerous, or unknown
     * also returns all possible board configurations
     * 
     * algorithm:
     * DFS through unrevealed cells that share and adjacency with the same number tile
     * have a stack that contains history of previously assigned values
     * try bomb first, if valid DFS further. If invalid, try empty. If empty is invalid backtrack and change past value
     * when backtracking add backtracked values to the toVisit stack for DFS to make sure values are not lost
     * if a valid solution is found with nothing left to visit, then a solution is found and backtrack to find more solutions
     * 
     * @returns possibleBoards - an array that returns possible configurations
     *                           [group][configuration][row][col]
     *                           each group is an independent set of tiles
     *                           possibleBoards[group][i] stores configuration i for that group
     *                           values within array are UNPLACEDVAL, EMPTYVAL, BOMBVAL
     * @returns dangerMap - returns an array containing whether each tile is Tilestate.dangerous, Tilestate.safe, or Tilestate.unknown
     * @returns safeExists - is there any guarenteed safe tile on the board
     */
    function populateValidity () : {possibleBoards: number[][][][], dangerMap: TileState[][], safeExists: boolean} {
        let possibleBoards: number[][][][] = [] // see return value in function documentation

        // arrays to store the chance of a given cell containing a bomb or being safe
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
        
        // set to store all tiles that need to be calculated
        let toValidate = new Set<number>(); // we have to use flattened indexes for set (row * boardWidth + col) since js Set cant do tuples
        
        // add all unrevealed tiles adjacent to a revealed number tile
        for (let row = 0; row < boardHeight; row++) {
            for (let col = 0; col < boardWidth; col++) {
                if (!board[row][col].revealed) { // look for unrevealed tiles
                    let found = false;
                    for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) { // look for an adjacent revealed number tile
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

        while (toValidate.size > 0) { // make sure all nodes are calculated
            // possible boards for this edge
            let possibleBoardsInConfig: number[][][] = []

            // track how many successful patterns were made
            let totalConfigs = 0;
            
            // track number of times bomb is at this location
            let bombTracker: number[][] = [];
            let safeTracker: number[][] = [];
            
            // temp board to put bombs on
            let tempBoard: number[][] = [];
            
            // initialize the 2d array variables
            for (let row = 0; row < boardHeight; row++) {
                bombTracker[row] = [];
                tempBoard[row] = [];
                safeTracker[row] = [];
                for (let col = 0; col < boardWidth; col++) {
                    bombTracker[row][col] = 0;
                    tempBoard[row][col] = UNPLACEDVAL; // initialize to unplaced values everywhere instead of empty
                    safeTracker[row][col] = 0;
                }
            }

            // data structures to help with backtracking
            let visitedStack: populateValidityStackInfo[] = [] // stores current path taken (X coord, Y coord, value tried) 
            let toVisit: populateValidityStackInfo[] = []; // stores tiles to visit (X coord, Y coord, value to try)
            let inToVisit = new Set<number>(); // set that keeps track of what is in toVisit so we dont double add to the stack
            
            // pick a random point to start with
            let startPoint = toValidate.values().next().value;
            let startRow = Math.floor(startPoint / boardWidth);
            let startCol = startPoint % boardWidth;
            toVisit.push({row: startRow, col:startCol, val: BOMBVALUE});
            inToVisit.add(flattenCoord(startRow, startCol));

            while (toVisit.length > 0) {
                let toVisitVal = toVisit.pop();
                
                // null check or else typescript gets upset
                if (!toVisitVal) {console.log("ERROR IN POPULATE VALIDITY"); return{possibleBoards:[], dangerMap:[], safeExists:false};}

                let {row, col, val} = toVisitVal;


                toValidate.delete(flattenCoord(row, col)); // mark this cell as visited
                inToVisit.delete(flattenCoord(row, col)); // open up to future visits now that it isnt in toVisit stack

                let visitCandidates: populateValidityStackInfo[] = []; // nodes to visit from here
                
                tempBoard[row][col] = val; // try proposed value

                let valid = true; // is this proposed value currently valid?

                for (let adjacentRow = row - 1; adjacentRow <= row + 1; adjacentRow++) {
                    for (let adjacentCol = col - 1; adjacentCol <= col + 1; adjacentCol++) { // find number tiles adjacent to current tile
                        if (
                            adjacentRow >= 0 && adjacentRow < boardHeight && // ensure row bound
                            adjacentCol >= 0 && adjacentCol < boardWidth && // ensure col bound
                            board[adjacentRow][adjacentCol].revealed && // ensure tile is revealed
                            board[adjacentRow][adjacentCol].value > 0 // ensure tile has number on it
                        ) {
                            // count bombs/potential bombs adjacent to that number tile based on current path taken
                            let bombVal = board[adjacentRow][adjacentCol].value;
                            let bombCount = 0; // actual bombs next to tile 
                            let potentialBombCount = 0; // potential bombs next to tile (unassigned tiles)
                            for (let numberAdjacentRow = adjacentRow - 1; numberAdjacentRow <= adjacentRow + 1; numberAdjacentRow++) { // loop through all adjacent unrevealed tiles
                                for (let numberAdjacentCol = adjacentCol - 1; numberAdjacentCol <= adjacentCol + 1; numberAdjacentCol++) { 
                                    if (
                                        numberAdjacentRow >= 0 && numberAdjacentRow < boardHeight && // ensure row bound
                                        numberAdjacentCol >= 0 && numberAdjacentCol < boardWidth && // ensure col bound
                                        !board[numberAdjacentRow][numberAdjacentCol].revealed // ensure tile is NOT revealed
                                    ) {
                                        switch(tempBoard[numberAdjacentRow][numberAdjacentCol]) { // if we assigned a value to the tile, previous use that. If not, count it as a potential bomb.
                                            case UNPLACEDVAL: {
                                                potentialBombCount++;
                                                if (!inToVisit.has(flattenCoord(numberAdjacentRow, numberAdjacentCol))) { // if we have not seen this tile, add it to the stack
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

                            // check if config is not possible
                            // if the number of bombs is already more than the number, this is invalid
                            // if the number of bombs + number of potential bombs is less than the number, this is invalid
                            if (bombCount > bombVal || bombCount + potentialBombCount < bombVal) {
                                valid = false;
                            }
                        }
                        if (!valid) break; // optimization to break out of loops fast
                    }
                    if (!valid) break; // optimization to break out of loops fast
                }

                // optimization to do nearby nodes first to try end branches early
                visitCandidates.sort((a, b) => {
                    return  Math.abs(b.row - row) + Math.abs(b.col - col) - (Math.abs(a.row - row) + Math.abs(a.col - col));
                });

                // add all new tiles found to the stack
                visitCandidates.forEach((val : populateValidityStackInfo) => {
                    toVisit.push(val);
                });

                if (valid) {
                    // add this to the path
                    visitedStack.push({row, col, val});

                    // if there are still nodes to visit, we have not found a full match yet. Keep going!
                    if (toVisit.length != 0) continue;
                     
                    // found a full match!
                    let deepCopy: number[][] = [];
                    for (let copyRow = 0; copyRow < boardHeight; copyRow++) { // save this as a configuration
                        deepCopy[copyRow] = [];
                        for (let copyCol = 0; copyCol < boardWidth; copyCol++) {
                            deepCopy[copyRow][copyCol] = tempBoard[copyRow][copyCol];
                            bombTracker[copyRow][copyCol] += (tempBoard[copyRow][copyCol] == BOMBVALUE ? 1 : 0);
                            safeTracker[copyRow][copyCol] += (tempBoard[copyRow][copyCol] == 0 ? 1 : 0);
                        }
                    }

                    possibleBoardsInConfig.push(deepCopy);
                    totalConfigs++;
                }

                // teardown some of the path to try a new path as either we have found a valid path, or this path doesnt work
                tempBoard[row][col] = UNPLACEDVAL; // reset this tile's value
                if (val == BOMBVALUE) {
                    inToVisit.add(flattenCoord(row, col)); // since bomb didnt work here, try empty
                    toVisit.push({row, col, val:0});
                } else {
                    inToVisit.add(flattenCoord(row, col)); // bomb and empty didnt work here, add bomb and go back more levels
                    toVisit.push({row, col, val:BOMBVALUE});
                    
                    while (visitedStack.length > 0) {
                        let visitedVal = visitedStack.pop()
                        if (visitedVal) { // go back until we are trying empty instead of bomb. since we try bomb before empty, changing from empty->bomb doesnt intro a new combination
                            tempBoard[visitedVal.row][visitedVal.col] = UNPLACEDVAL; // remove value placed by that tile
                            if (visitedVal.val == BOMBVALUE) { // add opposite value to stack: bomb->empty, empty->bomb
                                inToVisit.add(flattenCoord(visitedVal.row, visitedVal.col)); // add removed value to toVisit stack so we are sure to return to it
                                toVisit.push({row: visitedVal.row, col: visitedVal.col, val: EMPTYVALUE});
                                break;
                            } else {
                                inToVisit.add(flattenCoord(visitedVal.row, visitedVal.col)); // add removed value to toVisit stack so we are sure to return to it
                                toVisit.push({row: visitedVal.row, col: visitedVal.col, val: BOMBVALUE});
                            }
                        }
                    }

                    if (visitedStack.length == 0 && toVisit[toVisit.length - 1].val == BOMBVALUE) break; // if we change the first node from empty->bomb, we have exhaused all combinations
                }
            }

            // update odds arrays
            // to get odds (number of times (bomb/safe) / total configurations)
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
            possibleBoards.push(possibleBoardsInConfig); // save this groups configuration arrays to final output array
        }


        // is there a guarenteed safe tile anywhere
        let safeExists = false;

        // a map that contains which tiles are guarenteed safe, guarenteed dangerous, or unknown
        let dangerMap: TileState[][] = [];

        for (let row = 0; row < boardHeight; row++) {
            dangerMap[row] = []
            for (let col = 0; col < boardWidth; col++) {
                if (oddsBomb[row][col] == 1) { // if 100% bomb, guarenteed dangerous
                    dangerMap[row][col] = TileState.dangerous;
                }
                else if (oddsSafe[row][col] == 1) { // if 100% safe, guarenteed safe
                    dangerMap[row][col] = TileState.safe;
                    safeExists = true;
                }
                else {
                    dangerMap[row][col]= TileState.unknown;
                }
            }
        }

        return {possibleBoards, dangerMap, safeExists};
    }
    
    /**
     * Change the bomb locations to force an empty or bomb tile on a particular row or column using a set of given possible board configurations
     * 
     * @param possibleBoards - set of possible board configurations [group][config][row][column] (refer to populateValidity())
     * @param rowForce - row of cell that is being forced to a value
     * @param colForce - col of cell that is being forced to a value
     * @param val - value that cell is being forced to
     */
    function changeBombLocations (possibleBoards: number[][][][], rowForce: number, colForce: number, val: number) : void {
        let bombsPlaced = 0;
        let newBoard:TileProps[][] = []

        // set storing flattened indicies of places where bomb can be placed
        let bombPlacableLocations = new Set<number>();
        
        // initialize new board while populating potential bomb locations
        for (let row = 0; row < boardHeight; row++) {
            newBoard[row] = []
            for (let col = 0; col < boardWidth; col++) {
                newBoard[row][col] = {revealed: board[row][col].revealed, flagged: board[row][col].flagged, value: 0};
                
                if (!board[row][col].revealed) { // bombs can only be placed on unrevealed tiles
                    bombPlacableLocations.add(flattenCoord(row, col));
                } 
            }
        }

        for (let group = 0; group < possibleBoards.length; group++) { // do each independent group separately
            let filteredBoards = possibleBoards[group].filter((board) => { // get rid of any tiles that force the forced tile with the wrong value
                return (board[rowForce][colForce] === val) || (board[rowForce][colForce] === UNPLACEDVAL)
            })

            // get a random index to pick a random configuration within the possible configurations
            let randomConfigIdx = Math.floor(Math.random() * filteredBoards.length);

            for (let copyRow = 0; copyRow < boardHeight; copyRow++) { // copy the configuration to our new board
                for (let copyCol = 0; copyCol < boardWidth; copyCol++) {
                    if (filteredBoards[randomConfigIdx][copyRow][copyCol] !== UNPLACEDVAL) { // if the configuration had a definitive value for a cell, dont allow a bomb to be placed here
                        bombPlacableLocations.delete(flattenCoord(copyRow, copyCol));
                    }
                    if (filteredBoards[randomConfigIdx][copyRow][copyCol] === BOMBVALUE) {  // if the configuration has a bomb here, bomb must be placed here
                        newBoard[copyRow][copyCol].value = BOMBVALUE;
                        bombsPlaced++;
                    }
                }
            }
        }

        // place any extra remaining bombs
        let bombPlacableLocationArray = [...bombPlacableLocations]

        for (; bombsPlaced < numBombs; bombsPlaced++) {
            // pick random location among valid locations
            let randomIdx = Math.floor(Math.random() * bombPlacableLocationArray.length);
            let bombLocation = bombPlacableLocationArray[randomIdx];
            let bombRow = Math.floor(bombLocation / boardWidth);
            let bombCol = bombLocation % boardWidth;;
            
            // set location as bomb
            newBoard[bombRow][bombCol].value = BOMBVALUE;
            
            // swap delete entry, just a way to delete from array in O(1) when ordering doesnt matter
            bombPlacableLocationArray[randomIdx] = bombPlacableLocationArray[bombPlacableLocationArray.length - 1];
            bombPlacableLocationArray.pop();
        }

        setBoard(newBoard);
        return;
    }
}
  
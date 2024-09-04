import React from "react";
import { MINIMUMEMPTYTILES, MAXBOARDWIDTH, MAXBOARDHEIGHT } from "../constants.tsx"
import "./minesweeperSettings.css"

interface MinesweeperSettingsProps {
    numBombs: number,
    flagCount: number,
    boardWidth: number,
    boardHeight: number,
    revealedCount: number,
    setBoardWidth: (number) => void,
    setBoardHeight: (number) => void
    setNumBombs: (number) => void
}

export default function MinesweeperSettings({ numBombs, flagCount, boardWidth, boardHeight, revealedCount, setBoardHeight, setBoardWidth, setNumBombs} : MinesweeperSettingsProps) : JSX.Element {
    return (
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
    );
}
  
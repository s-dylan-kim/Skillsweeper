import React, { useState } from "react";

import { TileState, TileProps } from "./tileTypes.ts";
import "./minesweeperTile.css";

export default function MinesweeperTile({ revealed, flagged, onClick} : TileProps & {onClick? : React.MouseEventHandler}) : JSX.Element {

    return (
        <div className="minesweeper-tile" onClick={ onClick }>
            
        </div>
    );
}
  
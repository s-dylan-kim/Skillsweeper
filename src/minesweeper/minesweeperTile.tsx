import React, { useState } from "react";

import { TileState, TileProps } from "./tileTypes.ts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag, faBomb } from '@fortawesome/free-solid-svg-icons'
import "./minesweeperTile.css";

const UNREVEALEDCOLOR = "grey";
const REVEALEDCOLOR = "ghostwhite";
const BOMBCOLOR = "red";
const FLAGCOLOR = "lemonchiffon";

interface MinesweeperTileProps extends TileProps {
    onClick : React.MouseEventHandler,
    onContextMenu: React.MouseEventHandler
}

export default function MinesweeperTile({ revealed, flagged, value, onClick, onContextMenu} : MinesweeperTileProps) : JSX.Element {

    function MinesweeperTileStyle() : React.CSSProperties {
        return { backgroundColor: revealed ? REVEALEDCOLOR : UNREVEALEDCOLOR };
    }

    function MinesweeperTileContent() {
        if (!revealed) {
            if (flagged) return <FontAwesomeIcon icon={faFlag} color = {FLAGCOLOR} />; // put flag svg here
            else return "";
        }
        if (value == -1) {
            return <FontAwesomeIcon icon={faBomb} color={ BOMBCOLOR }/>; // put bomb svg here
        }
        if (value == 0) {
            return "";
        }
        return value;
    }

    return (
        <div className="minesweeper-tile" 
            onClick={ onClick }
            onContextMenu={ onContextMenu }
            style = { MinesweeperTileStyle() }
        >
            { MinesweeperTileContent() }
        </div>
    );
}
  
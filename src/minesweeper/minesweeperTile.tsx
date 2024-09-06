import React from "react";

import { TileProps } from "./minesweeperTypes.ts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag, faBomb } from '@fortawesome/free-solid-svg-icons'
import "./minesweeperTile.css";
import { HIGHLIGHTRED, HIGHLIGHTGREEN } from "../constants.tsx";

const UNREVEALEDCOLOR = "grey";
const REVEALEDCOLOR = "ghostwhite";
const BOMBCOLOR = "darkred";
const FLAGCOLOR = "lemonchiffon";


interface MinesweeperTileProps extends TileProps {
    onClick : React.MouseEventHandler,
    onContextMenu: React.MouseEventHandler
}

export default function MinesweeperTile({ revealed, flagged, value, highlight, onClick, onContextMenu} : MinesweeperTileProps) : JSX.Element {

    function fontColor(): React.CSSProperties {
        switch (value) {
            case 1:
                return {color:"blue"};
            case 2:
                return {color:"green"};
            case 3:
                return {color:"red"};
            case 4:
                return {color:"darkviolet"};
            case 5:
                return {color:"maroon"};
            case 6:
                return {color:"darkcyan"};
            case 7:
                return {color:"purple"};
            case 8:
                return {color:"gray"};
        }
        return {};
    }

    function minesweeperTileStyle() : React.CSSProperties {
        if (highlight === HIGHLIGHTRED) {
            return { backgroundColor: "red" };
        } else if (highlight === HIGHLIGHTGREEN) {
            return { backgroundColor: "green" };
        } else if (!revealed) {
            return { backgroundColor: UNREVEALEDCOLOR };
        } else {
            return { ...fontColor(), backgroundColor : REVEALEDCOLOR };
        }
    }

    function minesweeperTileContent() {
        if (!revealed) {
            if (flagged) return <FontAwesomeIcon icon={faFlag} color = { FLAGCOLOR } />; // put flag svg here
            else return "";
        }
        if (value === -1) {
            return <FontAwesomeIcon icon={faBomb} color={ BOMBCOLOR }/>; // put bomb svg here
        }
        if (value === 0) {
            return "";
        }
        return value;
    }

    return (
        <div className="minesweeper-tile" 
            onClick={ onClick }
            onContextMenu={ onContextMenu }
            style = { minesweeperTileStyle() }
        >
            { minesweeperTileContent() }
        </div>
    );
}
  
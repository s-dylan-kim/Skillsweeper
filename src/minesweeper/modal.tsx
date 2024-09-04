import React from "react";
import ReactDom from "react-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import "./modal.css"

interface ModalProps {
    showModal: boolean,
    gameWon: boolean,
    showHelp: boolean
    revealedCount: number,
    totalTiles: number
    buttonOnClick: ()=>void
}

export default function Modal({ showModal, gameWon, showHelp, revealedCount, totalTiles, buttonOnClick } : ModalProps) : JSX.Element {
    if (!showModal) return <></>;
    return ReactDom.createPortal(
        <>
            <div id="modal-overlay"/>
            <div id="modal">
                <b id="modal-title"> {titleContent(showHelp, gameWon)} </b>
                <p className="modal-description">
                    {descriptionContent(showHelp, gameWon)}
                </p>
                <button onClick={buttonOnClick} className="modal-button"> { showHelp ? <FontAwesomeIcon className="modal-fa-icon" icon={faPlay} /> : <FontAwesomeIcon className="modal-fa-icon" icon={faRotateRight} /> } </button>
            </div>
        </>,
        document.getElementById('portal')! // assert that the portal id always exists
    )

    function titleContent(showHelp: boolean, gameWon: boolean): string {
        if (showHelp) {
            return "Welcome";
        }
        if (gameWon) {
            return "Congratulations";
        } else {
            return "Game Over";
        }
    }

    function descriptionContent(showHelp: boolean, gameWon: boolean): string {
        if (showHelp) {
            return "This is skillsweeper. A variant of minesweeper that punishes guessing, but doesn't punish bad luck.\nIf you take a 50/50 guess when there is a guarenteed move, you will always lose the 50/50.\nIf you are forced to take a 50/50, there will never be a mine under the 50/50.\nAll other rules are like standard minesweeper. \nGood Luck!";
        }
        if (gameWon) {
            return `You Revealed all ${revealedCount} Tiles!`;
        } else {
            return `You Revealed ${revealedCount}/${totalTiles} Tiles.`;
        }
    }
}
  
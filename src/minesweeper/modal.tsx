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
                <b id="modal-title"> { gameWon ? "Congratulations" : "Game Over" } </b>
                <p className="modal-description">
                    {gameWon ? `You Revealed all ${revealedCount} Tiles!` : `You Revealed ${revealedCount}/${totalTiles} Tiles.`}
                </p>
                <button onClick={buttonOnClick} className="modal-button"> { showHelp ? <FontAwesomeIcon className="modal-fa-icon" icon={faPlay} /> : <FontAwesomeIcon className="modal-fa-icon" icon={faRotateRight} /> } </button>
            </div>
        </>,
        document.getElementById('portal')! // assert that the portal id always exists
    )
}
  
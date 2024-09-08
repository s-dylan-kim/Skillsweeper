import React from "react";
import ReactDom from "react-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import "./modal.css"

interface ModalProps {
    showModal: boolean,
    buttonOnClick: ()=>void
}

export default function Modal({ showModal, buttonOnClick } : ModalProps) : JSX.Element {
    if (!showModal) return <></>;
    return ReactDom.createPortal(
        <>
            <div id="modal-overlay"/>
            <div id="modal">
                <b id="modal-title"> 
                    Welcome
                </b>
                <p className="modal-description">
                    This is skillsweeper. <br/>
                    A variant of minesweeper that punishes guessing, but doesn't punish bad luck.<br/>
                    If you take a 50/50 guess when there is a guarenteed move, you will always lose the 50/50.<br/>
                    If you are forced to take a 50/50, there will never be a mine under the 50/50.<br/>
                    All other rules are like standard minesweeper.<br/>
                    <br/>
                    After a loss, all guarenteed safe tiles will be highlighted in green<br/>
                    <br/>
                    WARNING: Program may hang with larger board sizes
                    <br/>
                    Good Luck!
                </p>
                <button onClick={buttonOnClick} className="modal-button">
                    <FontAwesomeIcon className="modal-fa-icon" icon={faPlay} />
                </button>
            </div>
        </>,
        document.getElementById('portal')! // assert that the portal id always exists
    );
}
  
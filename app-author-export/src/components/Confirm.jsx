import { Modal } from 'react-bootstrap';

import * as bridge_params from "../Bridge";

function ConfirmModal({ show, confirmMessage, onAction, onClose }) {
    return <Modal className="opacity1" show={show !== -1} onHide={onClose} dialogClassName="w-725">
        <Modal.Header closeButton>
            <Modal.Title className="in-line">{bridge_params.confirm_label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="row text-center">
                {confirmMessage}
            </div>
        </Modal.Body>
        <Modal.Footer>
            <div className="col-sm-12">
                <div className="row text-center">
                    <button variant="primary" type="button" className="btn btn-default" onClick={() => onAction(show === 1)}>
                        {bridge_params.run_label}
                    </button>
                    <button variant="secondary" type="button" className="btn btn-default cancel" onClick={onClose}>
                        {bridge_params.cancel_label}
                    </button>
                </div>
            </div>
        </Modal.Footer>
    </Modal>;
}

export default ConfirmModal;

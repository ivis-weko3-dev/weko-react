import React from "react";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";
import { Modal } from 'react-bootstrap';

import { AppContext } from '../../Context';

class SelectTab extends React.Component {
    static contextType = AppContext;

    constructor(props) {
        super(props);

        this.state = {
            file: null,
            fileName: "",
            isChecking: false,
            isChecked: false,
            showConfirmModal: false,
            modalCheckbox: false,
        };
    }
    setIsCheckedState = (bool) => {
        this.setState({ isChecked: bool })
    }

    setModalState = (bool) => {
        this.setState({ showConfirmModal: bool })
    }

    setModalCheckboxState = (bool) =>{
        this.setState({ modalCheckbox: bool })
    }
    getLastString = (path, code) => {
        const split_path = path.split(code);
        return split_path.pop();
    }

    onChangeFile = (e) => {
        const file = e.target.files[0];
        const fileName = this.getLastString(e.target.value, "\\");
        if (this.getLastString(fileName, ".") !== 'tsv') {
            return false;
        }

        this.setState({ fileName });

        const reader = new FileReader();
        reader.onload = () => {
            this.setState({
                file: reader.result
            });
        };
        reader.readAsDataURL(file);
    }

    onCheckImportFile = async () => {
        const { setImportData, setErrorMessage, setIsAgree } = this.context;
        const { fileName, file, isChecked } = this.state;
        if (!file) {
            return;
        }

        this.setState({ isChecking: true });
        try {
            const response = await fetch(
                bridge_params.entrypoints.check_import_file,
                {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file_name: fileName,
                        file
                    }),
                }
            );
            const json = await response.json();
            if (json.error) {
                setErrorMessage(json.error);
            } else {
                setImportData(json.list_import_data);
                setIsAgree(isChecked)
            }
        } catch (error) {
            setErrorMessage(bridge_params.internal_server_error);
        }
        this.setState({ isChecking: false });
    }
    handleCheckboxChange = (e) => {
        if (e.target.checked) {
            this.setIsCheckedState(e.target.checked);
            this.setModalState(1);
        } else {
            this.setIsCheckedState(e.target.checked);
        }
    };

    handleModalAction = (confirmed) => {
        this.setModalState(0);
        if (confirmed) {
            this.setIsCheckedState(true);
        }
    };
    handleModalClose = () => {
        this.setModalState(0);
        this.setIsCheckedState(false);
        this.setModalCheckboxState(false);
    };
    render() {
        const { fileName, file, isChecking, isChecked, showConfirmModal, modalCheckbox } = this.state;
        const { importStatus } = this.context;
        return (
            <div className="col-sm-12">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="row">
                            <div className="col-md-2 col-cd">
                                <label>{bridge_params.select_file_label}</label>
                            </div>
                            <div className="col-md-8">
                                <div>
                                    <button
                                        className="btn btn-primary"
                                        disabled={importStatus === config.IMPORT_STATUS.IMPORTING}
                                        onClick={() => { this.inputFileElement.click() }}>
                                        {bridge_params.select_file_label}
                                    </button>
                                    <input
                                        type="file"
                                        className="hide"
                                        ref={input => this.inputFileElement = input}
                                        accept=".tsv,.csv"
                                        onChange={this.onChangeFile} />
                                </div>
                                <div className="block-placeholder">
                                    {
                                        fileName ? <p className="active">{fileName}</p> : <p>{bridge_params.selected_file_name_label}</p>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={this.handleCheckboxChange}
                                />
                                {bridge_params.force_change_mode_label}
                            </label>
                        </div>
                        <div className="row">
                            <div className="col-md-2">
                                <button
                                    className="btn btn-primary"
                                    disabled={!file || importStatus === config.IMPORT_STATUS.IMPORTING}
                                    onClick={this.onCheckImportFile}>
                                    {isChecking ? <div className="loading" /> : <span className="glyphicon glyphicon-download-alt icon"></span>}
                                    {bridge_params.next_label}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal className="opacity1" show={showConfirmModal} onHide={this.handleModalClose} dialogClassName="w-725"
                 centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="in-line">{bridge_params.force_change_mode_label}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_1_label}
                        </div>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_2_label}
                        </div>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_3_label}
                        </div>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_4_label}
                        </div>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_5_label}
                        </div>
                        <div className="row modal-text">
                            {bridge_params.disclaimer_6_label}
                        </div>
                        <div className="row modal-text" style={{ marginTop: '5px' }}>
                            <label >
                                <input
                                    type="checkbox"
                                    checked={modalCheckbox}
                                    onChange={(e) => this.setModalCheckboxState(e.target.checked)}
                                />
                                {bridge_params.i_agree_label}
                            </label>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="col-sm-12">
                            <div className="row text-center">
                                <button variant="primary" type="button" className="btn btn-default" onClick={() => this.handleModalAction(showConfirmModal === true )} disabled={!modalCheckbox}>
                                    OK
                                </button>
                                <button variant="secondary" type="button" className="btn btn-default cancel" onClick={this.handleModalClose}>
                                    {bridge_params.cancel_label}
                                </button>
                            </div>
                        </div>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default SelectTab;

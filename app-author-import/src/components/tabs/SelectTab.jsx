import React from "react";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";
import { Modal } from 'react-bootstrap';

import { AppContext } from '../../Context';
import { result } from "lodash";

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

    onChangeTarget = (e) => {
        const { setTarget } = this.context;
        this.setState({ file: null, fileName: "" });
        setTarget(e.target.value);
    }
    
    onChangeFile = async (e) => {
        const { isTarget, setErrorMessage } = this.context;
        const file = e.target.files[0];
        const fileName = this.getLastString(e.target.value, "\\");
        if (this.getLastString(fileName, ".") !== 'tsv') {
            return false;
        }
        this.setState({ fileName });
    
        const reader = file.stream().getReader();
        const decoder = new TextDecoder('utf-8');
        let fileContent = '';
        let firstLine = '';
        let one_line_flag = true;
        while (one_line_flag) {
            const { done, value } = await reader.read();
            if (done) break;
            fileContent += decoder.decode(value, { stream: true });
    
            firstLine = fileContent.split('\n')[0];
            let validate_target = this.validateFirstLine(isTarget, firstLine);
            if (!validate_target) {
                setErrorMessage(bridge_params.different_format_file_for_target);
                return;
            }else{
                one_line_flag = false;
            }
        }
        const filereader = new FileReader();
        filereader.onload = () => {
            this.setState({
                file: filereader.result
            });
        };
        filereader.readAsDataURL(file);
    }

    validateFirstLine = (isTarget, line) => {
        let validateResult = true;
        const trimmedLine = line.trim();
        if (isTarget === "id_prefix") {
            validateResult = (trimmedLine === "#author_prefix_settings");
        }else if (isTarget === "affiliation_id" ){
            validateResult = (trimmedLine === "#author_affiliation_settings");
        }else if (isTarget === "author_db" ){
            validateResult = (trimmedLine !== "#author_prefix_settings") && (trimmedLine !== "#author_affiliation_settings");
        }
        return validateResult;
    }

    onCheckImportFile = async () => {
        const { setImportData, setErrorMessage, isTarget, setIsAgree } = this.context;
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
                        file,
                        target: isTarget
                    }),
                }
            );
            const json = await response.json();
            if (json.error) {
                setErrorMessage(json.error);
            } else {
                setImportData(json);
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
        const { importStatus, isTarget } = this.context;
        const { fileName, file, isChecking , isChecked, showConfirmModal, modalCheckbox } = this.state;
        return (
            <div className="col-sm-12">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="row">
                            <div className="col-md-2 col-cd">
                                <label>{bridge_params.import_target}</label>
                            </div>
                        </div>
                        <div className="row">
                            <div className="margin width-10percent">
                                <div>
                                    <select className="form-control" defaultValue={"author_db"} onChange={this.onChangeTarget}>
                                        <option value="author_db">{bridge_params.author_db_label}</option>
                                        <option value="id_prefix">{bridge_params.id_prefix_label}</option>
                                        <option value="affiliation_id">{bridge_params.affiliation_id_label}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-2 col-cd">
                                <label>{bridge_params.select_file_label}</label>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-8 margin">
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
                        <div className="row" disabled={ isTarget !== "author_db" || !file}>
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
                                    disabled={!file || importStatus === config.IMPORT_STATUS.IMPORTING || isChecking}
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

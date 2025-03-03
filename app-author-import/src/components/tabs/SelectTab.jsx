import React from "react";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";

import { AppContext } from '../../Context';
import { result } from "lodash";

class SelectTab extends React.Component {
    static contextType = AppContext;

    constructor(props) {
        super(props);

        this.state = {
            file: null,
            fileName: "",
            isChecking: false
        };
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
        const { setImportData, isTarget, setErrorMessage } = this.context;
        const { fileName, file } = this.state;
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
                setImportData(json.list_import_data);
            }
        } catch (error) {
            setErrorMessage(bridge_params.internal_server_error);
        }
        this.setState({ isChecking: false });
    }

    render() {
        const { fileName, file, isChecking } = this.state;
        const { importStatus } = this.context;
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
            </div>
        );
    }
}

export default SelectTab;

import React from "react";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";

import { AppContext } from '../../Context';

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
        const { setImportData, setErrorMessage } = this.context;
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
                        file
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
                                        accept=".tsv"
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

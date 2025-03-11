import React from "react";
import moment from "moment";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";

import { AppContext } from '../../Context';
import { prepareSuccessMsg, JSONToCSVConvertor } from "../../Common";

class ResultTab extends React.Component {
    static contextType = AppContext;

    prepareDisplayStatus = (status, importType, error_id) => {
        let msg = '';
        switch (status) {
            case "PENDING":
                msg = bridge_params.to_do_label;
                break;
            case "SUCCESS":
                msg = prepareSuccessMsg(importType);
                break;
            case "FAILURE":
                msg = bridge_params.error_label + ': '
                    + (error_id === 'delete_author_link' ?
                        bridge_params.delete_author_link_error :
                        bridge_params.import_fail_error
                    );
                break;
            default:
                break;
        }
        return msg;
    }

    handleDownload = async () => {
        const { tasks } = this.context;
        const data = tasks.map((task, key) => {
            return {
                [bridge_params.no_label]: key + 1,
                [bridge_params.start_date_label]: task.start_date ? task.start_date : '',
                [bridge_params.end_date_label]: task.end_date ? task.end_date : '',
                [bridge_params.pk_id_label]: task.record_id || '',
                [bridge_params.previous_weko_id_label]:task.previous_weko_id,
                [bridge_params.new_weko_id_label]:task.new_weko_id,
                [bridge_params.name_label]: task.fullname.join('\n'),
                [bridge_params.status_label]: this.prepareDisplayStatus(task.status, task.type, task.error_id)
            }
        })
        if (data) {
            JSONToCSVConvertor(data, 'Creator_List_Download_' + moment().format("YYYYDDMM"), true);
        }
    }

    handleDownloadForPrefix = async () => {
        const { tasks, isTarget } = this.context;
        const data = tasks.map((task, key) => {
            return {
                [bridge_params.no_label]: key + 1,
                [bridge_params.start_date_label]: task.start_date ? task.start_date : '',
                [bridge_params.end_date_label]: task.end_date ? task.end_date : '',
                [bridge_params.scheme_label]: task.scheme || '',
                [bridge_params.scheme_name_label]: task.name || '',
                [bridge_params.status_label]: this.prepareDisplayStatus(task.status, task.type, task.error_id)
            }
        })
        if (data) {
            const target = isTarget === "Id_Prefix" ? "ID_Prefix" : "Affiliation_Id";
            JSONToCSVConvertor(data, target +'_List_Download_' + moment().format("YYYYDDMM"), true);
        }
    }

    renderTableItem = (tasks) => {
        return tasks.map((task, key) => {
            return (
                <tr key={key}>
                    <td>{key + 1}</td>
                    <td>{task.start_date ? task.start_date : ''}</td>
                    <td>{task.end_date ? task.end_date : ''}</td>
                    <td>{task.record_id || ''}</td>
                    <td>{task.previous_weko_id || ''}</td>
                    <td>{task.new_weko_id || ''}</td>
                    <td>
                        {
                            task.fullname.map(name => {
                                return (<span key={key} className="newline">{name}</span>);
                            })
                        }
                    </td>
                    <td>
                        {this.prepareDisplayStatus(task.status, task.type, task.error_id)}
                    </td>
                </tr>
            )
        });
    };

    renderTableItemForPrefix = (tasks) => {
        return tasks.map((task, key) => {
            return (
                <tr key={key}>
                    <td>{key + 1}</td>
                    <td>{task.start_date ? task.start_date : ''}</td>
                    <td>{task.end_date ? task.end_date : ''}</td>
                    <td>{task.scheme || ''}</td>
                    <td>{task.name || ''}</td>
                    <td>
                        {this.prepareDisplayStatus(task.status, task.type, task.error_id)}
                    </td>
                </tr>
            )
        });
    };

    render() {
        const { tasks, recordNames, importStatus, isTarget } = this.context;

        let download_method;
        let columns=[];
        let renderTable;
        if (isTarget === "author_db") {
            download_method = this.handleDownload;
            columns.push(<th>{bridge_params.pk_id_label}</th>);
            columns.push(<th>{bridge_params.previous_weko_id_label}</th>);
            columns.push(<th>{bridge_params.new_weko_id_label}</th>);
            columns.push(<th><p className="table-title-170">{bridge_params.name_label}</p></th>);
            renderTable = this.renderTableItem(tasks, recordNames);
        }else if(isTarget === "id_prefix" || isTarget === "affiliation_id"){
            download_method = this.handleDownloadForPrefix;
            columns.push(<th>{bridge_params.scheme_label}</th>);
            columns.push(
                <th><p className="table-title-170">{bridge_params.scheme_name_label}</p></th>
            );
            renderTable = this.renderTableItemForPrefix(tasks);
        }

        return (
            <div className="result_container row">
                <div className="col-md-12 text-align-right">
                    <button
                        className="btn btn-primary"
                        onClick={download_method}
                        disabled={importStatus === config.IMPORT_STATUS.IMPORTING}>
                        <span className="glyphicon glyphicon-cloud-download icon"></span>{bridge_params.download_label}
                    </button>
                </div>
                <div className="col-md-12 m-t-20">
                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>{bridge_params.no_label}</th>
                                <th className="start_date"><p className="t_head">{bridge_params.start_date_label}</p></th>
                                <th className="end_date"><p className="t_head ">{bridge_params.end_date_label}</p></th>
                                {columns.map((column, index) => (
                                    {column}
                                ))}
                                <th><p className="table-title-100">{bridge_params.status_label}</p></th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTable}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

export default ResultTab;

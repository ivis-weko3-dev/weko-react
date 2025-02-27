import React from "react";
import _ from 'lodash';
import moment from "moment";
import cleanDeep from "clean-deep";

import * as bridge_params from "../../Bridge";
import * as config from "../../Config";

import { AppContext } from '../../Context';
import { cleanArrayData, JSONToCSVConvertor } from "../../Common";

class ImportTab extends React.Component {
    static contextType = AppContext;



    handlePageChange = async(pageNumber) => {
        // ページ変更時の処理をここに追加
        const { setRecords, setErrorMessage, setCurrentPage } = this.context;
        if (!pageNumber) {
            return;
        }

        try {
            const response = await fetch(
                bridge_params.entrypoints.check_pagination,
                {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page_number: pageNumber
                    }),
                }
            );
            const json = await response.json();
            if (json.error) {
                setErrorMessage(json.error);
            } else {
                setCurrentPage(pageNumber);
                setRecords(json);
            }
        } catch (error) {
            setErrorMessage(bridge_params.internal_server_error);
        }
    };

    handleDownload = () => {
        const { records } = this.context;
        const data = records.map((item, key) => {
            const mail = item.emailInfo ? cleanArrayData(item.emailInfo.map((email) => {
                return email.email;
            })).join('\n') : '';
            const error = item.errors ? item.errors.map(e => {
                return bridge_params.error_label + ': ' + e;
            }).join('\n').replace('<br/>', '\n') : '';
            const warning = item.warnings ? item.warnings.map(e => {
                return bridge_params.warning_label + ': ' + e;
            }).join('\n').replace('<br/>', '\n') : '';

            return {
                [bridge_params.no_label]: key + 1,
                [bridge_params.weko_id_label]: item.pk_id,
                [bridge_params.name_label]: item.fullname.join('\n'),
                [bridge_params.mail_address_label]: mail,
                [bridge_params.check_result_label]: (
                    (
                        item.errors ?
                            error
                            : (item.status === 'new' ?
                                bridge_params.register_label
                                : (item.status === 'update' ?
                                    bridge_params.update_label
                                    : (item.status === 'deleted' ? bridge_params.deleted_label : '')
                                )
                            )
                    ) + (warning ? '\n' : '') + (warning)
                )
            }
        });

        if (data) {
            JSONToCSVConvertor(data, 'Creator_Check_' + moment().format("YYYYDDMM"), true);
        }
    }

    summaryDataImport = (counts) => {
        console.log(counts);
        const numTotal = counts.num_total;
        const numNews = counts.num_new;
        const numUpdates = counts.num_update;
        const numDeleteds = counts.num_delete;
        const numErrors = counts.num_error;

        return { numTotal, numNews, numUpdates, numDeleteds, numErrors };
    }

    renderTableItem = (records) => {
        return records.map((item, key) => {
            return (
                <tr key={key}>
                    <td>
                        {key + 1}
                    </td>
                    <td>{item.pk_id}</td>
                    <td>
                        {
                            item.fullname.map(name => {
                                return (<span key={key} className="newline">{name}</span>);
                            })
                        }
                    </td>
                    <td>
                        {item.emailInfo ?
                            item.emailInfo.map((email, key) => {
                                return (
                                    <span key={key} className="newline">{email.email}</span>
                                );
                            })
                            : (<></>)
                        }
                    </td>
                    <td>
                        {
                            item['errors'] ?
                                item['errors'].map(e => {
                                    return <div dangerouslySetInnerHTML={{ __html: bridge_params.error_label + ': ' + e }} />
                                })
                                : (item.status === 'new' ?
                                    bridge_params.register_label
                                    : (item.status === 'update' ?
                                        bridge_params.update_label
                                        : (item.status === 'deleted' ? bridge_params.deleted_label : '')
                                    )
                                )
                        }
                        {
                            item['warnings'] && item['warnings'].map(e => {
                                return <div dangerouslySetInnerHTML={{ __html: bridge_params.warning_label + ': ' + e }} />
                            })
                        }
                    </td>
                </tr>
            )
        });
    }

    onImport = async () => {
        const { records, setErrorMessage, setTaskData } = this.context;
        let errorMsg = '';

        try {
            const importAuthorTaskId = localStorage.getItem(config.IMPORT_AUTHOR_TASK_ID_KEY);
            const importRecords = records.filter(item => !item.errors);
            const response = await fetch(
                bridge_params.entrypoints.import,
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        group_task_id: importAuthorTaskId,
                        records: cleanDeep(importRecords.map(item => {
                            const newItem = _.cloneDeep(item);
                            delete newItem.fullname;
                            delete newItem.warnings;
                            return newItem;
                        }))
                    })
                }
            );
            const json = await response.json();
            if (json.data) {
                json.data.tasks.forEach((task, idx) => {
                    task.fullname = importRecords[idx].fullname;
                    task.type = importRecords[idx].status;
                });
                setTaskData(json.data.group_task_id, json.data.tasks);
            } else if (!json.is_available) {
                if (json.celery_not_run) {
                    errorMsg = bridge_params.celery_not_run;
                } else if (json.continue_data) {
                    errorMsg = bridge_params.not_available_error;
                } else {
                    errorMsg = bridge_params.not_available_error_another;
                }
            }
        } catch (error) {
            console.log(error);
            errorMsg = bridge_params.internal_server_error;
        }

        setErrorMessage(errorMsg);
    }

    render() {
        const { records, importStatus, counts, currentPage, maxPage} = this.context;
        const { numTotal, numNews, numUpdates, numDeleteds, numErrors } = this.summaryDataImport(counts);
        return (
            <div className="check-component">
                <div className="row">
                    <div className="col-md-12 text-center">
                        <button
                            className="btn btn-primary"
                            onClick={this.onImport}
                            disabled={importStatus !== config.IMPORT_STATUS.PENDING}>
                            {
                                importStatus === config.IMPORT_STATUS.IMPORTING
                                    ? <div className="loading" />
                                    : <span className="glyphicon glyphicon-download-alt icon"></span>
                            }
                            {bridge_params.import_label}
                        </button>
                    </div>
                    <div className="col-md-12 text-center">
                        <div className="row block-summary">
                            <div className="col-lg-2 col-md-3 col-sm-3">
                                <h3><b>{bridge_params.summary}</b></h3>
                                <div className="flex-box">
                                    <div>{bridge_params.total_label}:</div>
                                    <div>{numTotal}</div>
                                </div>
                                <div className="flex-box">
                                    <div>{bridge_params.new_creator_label}:</div>
                                    <div>{numNews}</div>
                                </div>
                                <div className="flex-box">
                                    <div>{bridge_params.update_creator_label}:</div>
                                    <div>{numUpdates}</div>
                                </div>
                                <div className="flex-box">
                                    <div>{bridge_params.delete_creator_label}:</div>
                                    <div>{numDeleteds}</div>
                                </div>
                                <div className="flex-box">
                                    <div>{bridge_params.result_error_label}:</div>
                                    <div>{numErrors}</div>
                                </div>
                            </div>
                            <div className="col-lg-10 col-md-9 text-align-right">
                                <button
                                    className="btn btn-primary"
                                    onClick={this.handleDownload}>
                                    <span className="glyphicon glyphicon-cloud-download icon"></span>{bridge_params.download_label}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-12 m-t-20">
                        <table className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>{bridge_params.no_label}</th>
                                    <th>{bridge_params.weko_id_label}</th>
                                    <th><p className="table-title-170">{bridge_params.name_label}</p></th>
                                    <th><p className="table-title-170">{bridge_params.mail_address_label}</p></th>
                                    <th><p className="table-title-100">{bridge_params.check_result_label}</p></th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.renderTableItem(records)}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={maxPage}
                        onPageChange={this.handlePageChange}
                    />
                </div>
            </div>
        )
    }
}

class Pagination extends React.Component {
    render() {
        const { currentPage, totalPages, onPageChange } = this.props;

        const pageNumbers = [];
        const startPage = Math.max(1, currentPage - 5);
        const endPage = Math.min(totalPages, currentPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="col-sm-12 col-md-12 alignCenter">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <a onClick={() => onPageChange(currentPage - 1)} className="page-link">
                            &lt;
                        </a>
                    </li>
                    {pageNumbers.map(number => (
                        <li key={number} className={`page-item ${number === currentPage ? 'active' : ''}`}>
                            <a onClick={() => onPageChange(number)} className="page-link">
                                {number}
                            </a>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <a onClick={() => onPageChange(currentPage + 1)} className="page-link">
                            &gt;
                        </a>
                    </li>
                </ul>
            </div>
        );
    }
}

export default ImportTab;

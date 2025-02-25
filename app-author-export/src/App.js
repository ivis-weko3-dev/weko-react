import React from "react";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as bridge_params from "./Bridge";
import ConfirmModal from "./components/Confirm";
import AlertDismissible from "./components/Alert";


class AuthorExport extends React.Component {
  constructor() {
    super()
    this.state = {
      showConfirmModal: -1,
      isDisableExport: false,
      isDisableCancel: true,
      confirmMessage: '',
      isChecking: false,
      isExporting: false,
      isStopping: false,
      errorMsg: '',
      taskId: localStorage.getItem('authors_export_id'),
      downloadLink: '',
      filename: ''
    }
  }

  componentDidMount() {
    this.checkExportStatus();
  }

  onAction = (isExport) => {
    if (isExport) {
      this.onExport();
    } else {
      this.onCancel();
    }

    this.onClose();
  }

  onConfirm = (isExport) => {
    this.setState({
      showConfirmModal: isExport ? 1 : 0,
      confirmMessage: isExport ? bridge_params.export_message : bridge_params.cancel_message
    });
  }

  onCancel = async () => {
    try {
      const response = await fetch(
        bridge_params.entrypoints.cancel,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task_id: this.state.taskId }),
        }
      );
      const json = await response.json();
      if (json.data && json.data.status === 'success') {
        this.setState({
          isExporting: false,
          isStopping: false
        });
      } else {
        this.setState({
          errorMsg: bridge_params.cancel_export_error
        });
      }
    } catch (error) {
      this.setState({
        errorMsg: bridge_params.internal_server_error
      });
    }
  }

  onExport = async () => {
    const check = await this.checkExportStatus(false, true);
    if (!check) {
      return;
    }

    try {
      const response = await fetch(
        bridge_params.entrypoints.export,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      const json = await response.json();
      if (json.data) {
        this.setState({
          taskId: json.data.task_id
        });
        localStorage.setItem('authors_export_id', json.data.task_id);
        this.checkExportStatus(true);
      }
    } catch (error) {
      this.setState({
        isExporting: false,
        errorMsg: bridge_params.internal_server_error
      });
    }
  }

  onResume = async () => {
    this.setState({isStopping: false})
    const check = await this.checkExportStatus(false, true);
    if (!check) {
      return;
    }

    try {
      const response = await fetch(
        bridge_params.entrypoints.resume,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      const json = await response.json();
      if (json.data) {
        this.setState({
          taskId: json.data.task_id
        });
        localStorage.setItem('authors_export_id', json.data.task_id);
        this.checkExportStatus(true);
      }
    } catch (error) {
      this.setState({
        isExporting: false,
        errorMsg: bridge_params.internal_server_error
      });
    }
  }

  checkExportStatus = async (repeat = false, isCheckBeforeExport = false) => {
    this.setState({ isChecking: true });
    return await new Promise(resolve => {
      const intervalCheckStatus = setInterval(async () => {
        let result = { errorMsg: '' };
        try {
          const { taskId } = this.state;
          const response = await fetch(bridge_params.entrypoints.check_status, { method: "GET" });
          const json = await response.json();
          if (json.data) {
            const data = json.data;
            if (data.task_id && taskId === data.task_id){
              result.isExporting = true;
              repeat = true;
            } else if (data.stop_point) {
              result.isStopping = true;
              repeat = false;
            } else if (data.task_id) {
              result.errorMsg = bridge_params.is_exporting_other_device_error;
            } else if (data.error) {
              result.errorMsg = bridge_params.is_exporting_error;
            } else {
              if (repeat) {
                repeat = false;
                result.isExporting = false;
              }
            }
            result.downloadLink = data.download_link;
            result.filename = data.filename;
          } else {
            result.errorMsg = bridge_params.internal_server_error;
          }
        } catch (error) {
          result.errorMsg = bridge_params.internal_server_error;
        }

        if (result.errorMsg) {
          result.isExporting = false;
        }

        if (isCheckBeforeExport) {
          this.setState({ isExporting: true });
          this.setState({ isStopping: false});
        } else if (result.isStopping){
          this.setState({ isStopping: true});
          this.setState({ isExporting: false });
        }

        if (!repeat || result.errorMsg) {
          this.setState({ isChecking: false, ...result });
          resolve(this.state.errorMsg === '' && !result.isExporting);
          clearInterval(intervalCheckStatus);
        } else {
          this.setState({ ...result });
        }
      }, 1000);
    });
  }

  onClose = () => {
    this.setState({
      showConfirmModal: -1
    });
  }

  render() {
    const { errorMsg, downloadLink, filename, isExporting, isChecking, isStopping, 
      showConfirmModal, confirmMessage
    } = this.state;

    let exportButton;
    if (isExporting ) {
      exportButton = (
        <button disabled type="button" className="btn btn-primary margin">
            <div className="loading" />
            {bridge_params.export_label}
        </button>
      );
    } else if (isChecking) {
      exportButton = (
        <button disabled type="button" className="btn btn-primary margin">
          <div className="loading" /> {bridge_params.export_label}
        </button>
      );
    } else if (isStopping){
      exportButton = (
        <button type="button" className="btn btn-primary margin" onClick={this.onResume}>
          {bridge_params.resume_label}
        </button>
      )
    } else {
      exportButton = (
        <button type="button" className="btn btn-primary margin" onClick={() => this.onConfirm(true)}>
          {bridge_params.export_label}
        </button>
      );
    }
    return (
      <>
        <div className="col-sm-12">
          <AlertDismissible type='danger' msg={errorMsg} onClose={() => this.setState({ errorMsg: '' })} />
          <div className="row">
            <div className="col-sm-12">
              <label>{bridge_params.export_all_label}</label>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-12 text-center">
            {exportButton}
              <button disabled={!isExporting && !isStopping} type="button" className="btn btn-primary margin cancel" onClick={() => this.onConfirm(false)}>
                {bridge_params.cancel_label}
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-12">
              <label>{bridge_params.download_url_label}</label>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-12">
              {bridge_params.export_url_label}：
              <a href={downloadLink}>
                {filename}
              </a>
            </div>
          </div>
        </div>
        <ConfirmModal show={showConfirmModal} confirmMessage={confirmMessage} onAction={this.onAction} onClose={this.onClose} />
      </>
    )
  }
}

export default AuthorExport;

import React from "react";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as bridge_params from "./Bridge";
import * as config from "./Config";

import { AppContext } from './Context';
import { prepareDisplayName } from "./Common";
import { SelectTab, ImportTab, ResultTab } from './components/Tab';
import { AlertDismissible } from "./components/Alert";

class AuthorImport extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      tab: 'select',
      step: config.STEPS.SELECT_STEP,
      errorMsg: '',
      tasks: [],
      task_ids: [],
      records: [],
      counts:{},
      currentPage: 1,
      maxPage: 0,
      importStatus: config.IMPORT_STATUS.NONE,
      isShowMessage: false,
      setStep: this.setStep,
      onChangeTab: this.onChangeTab,
      setErrorMessage: this.setErrorMessage,
      isImportAvailable: this.isImportAvailable,
      setImportData: this.setImportData,
      setRecords: this.setRecords,
      setTaskData: this.setTaskData,
      setCurrentPage: this.setCurrentPage,
    }
  }

  componentDidMount = () => {
    this.isImportAvailable();
  }

  setStep = (step) => {
    this.setState({ step });
  };

  setRecords = (records) => {
    records.forEach(record => {
      record.fullname = prepareDisplayName(record.authorNameInfo);
    });
    this.setState({ records });
  };

  setCurrentPage = (currentPage) => {
    this.setState({ currentPage });
  };

  onChangeTab = (tab) => {
    const { step } = this.state;
    const current_tab = config.TABS.filter(item => {
      return item.tab_key === tab;
    })[0];

    if (step >= current_tab.step) {
      this.setState({ tab });
    };
  };

  setErrorMessage = (errorMsg) => {
    this.setState({ errorMsg });
  };

  setImportData = (records) => {
    let counts = records.counts||{};
    let maxPage = records.max_page;
    records = records.list_import_data;
    const canImport = records.filter(item => {
      return !item.errors || item.errors.length === 0;
    }).length > 0;

    records.forEach(record => {
      record.fullname = prepareDisplayName(record.authorNameInfo);
    });

    this.setState({
      tab: 'import',
      records: records,
      counts: counts,
      maxPage: maxPage,
      importStatus: canImport ? config.IMPORT_STATUS.PENDING : config.IMPORT_STATUS.NONE,
      step: config.STEPS.IMPORT_STEP,
      errorMsg: ''
    });
  };

  setTaskData = (group_task_id, tasks) => {
    localStorage.setItem(config.IMPORT_AUTHOR_TASK_ID_KEY, group_task_id);

    this.setState({
      tasks,
      tab: 'result',
      step: config.STEPS.RESULT_STEP,
      currentPage: 1,
      maxPage: Math.ceil(tasks.length/100),
      importStatus: config.IMPORT_STATUS.IMPORTING,
      task_ids: tasks.map(task => task.task_id)
    });

    this.onCheckImportStatus();
  };

  isImportAvailable = async () => {
    let result = false;
    let errorMsg = '';

    try {
      let checkUrl = bridge_params.entrypoints.is_import_available;
      const importAuthorTaskId = localStorage.getItem(config.IMPORT_AUTHOR_TASK_ID_KEY);
      if (importAuthorTaskId) {
        checkUrl += '?group_task_id=' + importAuthorTaskId;
      }

      const response = await fetch(checkUrl, { method: "GET" });
      const json = await response.json();
      if (!json.is_available) {
        if (json.celery_not_run) {
          errorMsg = bridge_params.celery_not_run;
        } else if (json.continue_data) {
          errorMsg = bridge_params.not_available_error;
          json.continue_data.records.forEach(record => {
            record.fullname = prepareDisplayName(record.authorNameInfo);
          });
          json.continue_data.tasks.forEach((task, idx) => {
            task.fullname = json.continue_data.records[idx].fullname;
            task.type = json.continue_data.records[idx].status;
          });

          this.setState({ records: json.continue_data.records });
          this.setTaskData(json.continue_data.group_task_id, json.continue_data.tasks);
        } else {
          errorMsg = bridge_params.not_available_error_another;
        }
      } else {
        result = true;
      }
    } catch (error) {
      console.log(error);
      errorMsg = bridge_params.internal_server_error;
    }

    this.setErrorMessage(errorMsg);
    return result;
  }

  onCheckImportStatus = async () => {
    return await new Promise(resolve => {
      const intervalCheckStatus = setInterval(async () => {
        const { tasks, task_ids } = this.state;
        let errorMsg = '';
        let isDone = true;

        try {
          const response = await fetch(
            bridge_params.entrypoints.check_import_status,
            {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tasks: task_ids })
            }
          );
          const data = await response.json();
          if (data) {
            const frontTask = data.tasks;
            const _tasks = frontTask.map(taskInfo => {
              const current_tasks = tasks.filter(task => task.task_id === taskInfo.task_id);
              const current_task = current_tasks && current_tasks.length > 0 ? current_tasks[0] : false;
              if (current_task) {
                current_task.status = taskInfo.status;
                current_task.start_date = taskInfo.start_date;
                current_task.end_date = taskInfo.end_date;
                current_task.error_id = taskInfo.error_id;

                if (taskInfo.status === 'PENDING') {
                  isDone = false;
                }
              }
              return current_task;
            });
            if (data.over_max){
              const overMaxStatus = data.over_max.status
              if(overMaxStatus === 'PENDING'){
                isDone = false;
              }
              else if (overMaxStatus === 'FAILURE'){
                errorMsg = bridge_params.import_fail_error;
              }
            }
            
            this.setState({
              tasks: _tasks,
              importStatus: isDone ? config.IMPORT_STATUS.DONE : config.IMPORT_STATUS.IMPORTING
            })
          } else {
            errorMsg = bridge_params.internal_server_error;
          }
        } catch (error) {
          console.log(error);
          errorMsg = bridge_params.internal_server_error;
        }

        if (errorMsg || isDone) {
          this.setErrorMessage(errorMsg);
          resolve(!isDone);
          clearInterval(intervalCheckStatus);
        }
      }, 1000);
    });
  }

  render() {
    const { tab, errorMsg } = this.state;
    return (
      <AppContext.Provider value={this.state}>
        <AlertDismissible type='danger' msg={errorMsg} onClose={() => this.setState({ errorMsg: '' })} />
        <div className="row">
          <div className="col-sm-12">
            <ul className="nav nav-tabs">
              {
                config.TABS.map((item, key) => {
                  return (
                    <li
                      key={key}
                      className={`${item.tab_key === tab ? 'active' : ''} nav-item`}
                      onClick={() => this.onChangeTab(item.tab_key)}>
                      <a className={`${item.tab_key === tab ? 'active' : ''} nav-link cursor-pointer`}>
                        {item.tab_name}
                      </a>
                    </li>
                  )
                })
              }
            </ul>
            <div className="tab-content">
              <div className={`${tab === config.TABS[0].tab_key ? '' : 'hide'}`}>
                <SelectTab />
              </div>
              <div className={`${tab === config.TABS[1].tab_key ? '' : 'hide'}`}>
                <ImportTab />
              </div>
              <div className={`${tab === config.TABS[2].tab_key ? '' : 'hide'}`}>
                <ResultTab />
              </div>
            </div>
          </div>
        </div>
      </AppContext.Provider>
    )
  }
}

export default AuthorImport;

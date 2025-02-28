import * as bridge_params from "./Bridge";

export const STEPS = {
    SELECT_STEP: 0,
    IMPORT_STEP: 1,
    RESULT_STEP: 2,
};

export const TABS = [
    {
        tab_key: 'select',
        tab_name: bridge_params.select_label,
        step: STEPS.SELECT_STEP
    },
    {
        tab_key: 'import',
        tab_name: bridge_params.import_label,
        step: STEPS.IMPORT_STEP
    },
    {
        tab_key: 'result',
        tab_name: bridge_params.result_label,
        step: STEPS.RESULT_STEP
    }
];

export const IMPORT_RECORDS_PER_PAGE = 100;

export const IMPORT_STATUS = {
    NONE: 0,
    PENDING: 1,
    IMPORTING: 2,
    DONE: 3
};

export const IMPORT_AUTHOR_TASK_ID_KEY = 'import_author_task_id';

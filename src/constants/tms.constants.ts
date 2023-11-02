export const TMS_MODULE_OPTIONS = "TMS_MODULE_OPTIONS";
export const TMS_BASE_API_URL = "https://api.qase.io/v1/";
export const TMS_GET_AUTHOR_EP = "author";
export const TMS_GET_PROJECT_EP = (code: string) => `project/${code}`;
export const TMS_GET_RESULTS_EP = (code: string) => `result/${code}`;
export const TMS_GET_RUN_EP = (code: string) => `run/${code}`;
export const TMS_GET_CASE_EP = (code: string) => `case/${code}`;
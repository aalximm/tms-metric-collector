export interface InfluxDBSchema {
	test_run: RunInfluxDBSchema;
	test_case?: CaseInfluxDBSchema;
	backlog_case: BacklogCaseSchema;
}

export interface RunInfluxDBSchema {
	measurment_name: string;
	steps_number: string;
	duration: string;
	is_automation: string;
	id?: string;
	description?: string;
	title?: string;
	user_id?: string;
	enviroment?: string;
}

export interface CaseInfluxDBSchema {
	measurment_name: string;
	steps_number: string;
	duration: string;
	is_automation: string;
	automation_status: string;
	id?: string;
	run_id?: string;
	status?: string;
};

export interface BacklogCaseSchema {
	measurment_name: string;
	case_name: string;
	steps_number: string;
	automation_status: string;
	id: string;
}

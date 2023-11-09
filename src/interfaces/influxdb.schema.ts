export interface InfluxDBSchema {
	test_run: RunInfluxDBSchema;
	test_case?: CaseInfluxDBSchema;
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
	id?: string;
	run_id?: string;
	status?: string;
};

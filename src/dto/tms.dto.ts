export interface TmsApiResponse<T> {
	status: boolean;
	result?: T;
	errorMessage?: string;
}

export interface TmsList<T> {
	total: number;
	filtered: number;
	count: number;
	entities: T[];
}

export interface TmsProject {
	title: string;
	code: string;
	counts: {
		cases: number;
		suites: number;
		milestones: number;
		runs: {
			total: number;
			active: number;
		};
		defects: {
			total: number;
			open: number;
		};
	};
}

export interface TmsAuthor {
	id: number;
	entity_type: string;
	name: string;
}

export interface TmsRun {
	id: number;
	title: string;
	description: string;
	start_time: string;
	end_time: string;
	user_id: number;
	stats: {
		total: number;
	};
	environment: {
		title: string;
	};
	tags: unknown[];
}

export interface TmsRunResult {
	hash: string;
	comment?: string;
	stacktrace?: string;
	run_id: number;
	case_id: number;
	status: string;
	end_time: string;
}

export interface TmsStep {
	hash: string;
	position: number;
	action: string;
	expected_result: string;
	steps: TmsStep[];
}

export interface TmsCase {
	id: number;
	position: number;
	title: string;
	custom_fields: CutomField[];
	description?: string;

	steps: TmsStep[];
}

interface CutomField {
	id: number;
	value: string;
}

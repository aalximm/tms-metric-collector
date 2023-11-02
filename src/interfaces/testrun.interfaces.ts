export interface ITestCaseRun {
	startTime: Date;
	endTime: Date;
	id: number;
	runId: number;
	stepsNumber: number;
	status: string;
}

export interface ITestRun {
	startTime: Date;
	endTime: Date;
	id: number;
	stepsNumber: number;
	userId?: number;
	enviroment?: string;
	title?: string;
	description?: string;
}
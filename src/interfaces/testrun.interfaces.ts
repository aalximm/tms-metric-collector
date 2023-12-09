export interface ITestCaseRun {
	startTime: Date;
	endTime: Date;
	id: number;
	runId: number;
	stepsNumber: number;
	status: string;
	automationStatus: number;
}

export interface ITestRun {
	startTime: Date;
	endTime: Date;
	id: number;
	stepsNumber: number;
	isAuto: boolean;
	userId?: number;
	enviroment?: string;
	title?: string;
	description?: string;
}
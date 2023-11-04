import { Point } from "@influxdata/influxdb-client";
import { ITestCaseRun, ITestRun } from "@interfaces/testrun.interfaces";

export class TestRun {
	testRunData: ITestRun;
	cases: TestCaseRun[];
	constructor(data?: ITestRun, cases?: TestCaseRun[]) {
		this.testRunData = data;
		this.cases = cases;
	}

	public toPoints(): Point[] {
		const runStartPoint = new Point("test run")
			.timestamp(this.testRunData.startTime)
			.intField("userId", this.testRunData.userId)
			.intField("id", this.testRunData.id)
			.intField("steps number", this.testRunData?.stepsNumber ?? 0)
			.intField("duration", this.testRunData.endTime.getTime() - this.testRunData.startTime.getTime())
			.stringField("description", this.testRunData?.description ?? "empty")
			.stringField("title", this.testRunData?.title ?? "empty");

		if (this.testRunData.enviroment) {
			runStartPoint.tag("enviroment", this.testRunData.enviroment);
		}
		const caseEndPoints: Point[] = this.cases.map(value => value.toPoint());

		return [runStartPoint, ...caseEndPoints];
	}
}

export class TestCaseRun {
	caseData: ITestCaseRun;

	constructor(caseData: ITestCaseRun) {
		this.caseData = caseData;
	}

	public toPoint(): Point {
		return new Point("test case")
				.timestamp(this.caseData.startTime)
				.intField("id", this.caseData.id)
				.intField("runId", this.caseData.runId)
				.intField("steps number", this.caseData?.stepsNumber ?? 0)
				.stringField("status", this.caseData.status)
				.intField("duration", this.caseData.endTime.getTime() - this.caseData.startTime.getTime());
	}
}

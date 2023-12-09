import { Point } from "@influxdata/influxdb-client";
import { CaseInfluxDBSchema, InfluxDBSchema } from "@interfaces/influxdb.schema";
import { ITestCaseRun, ITestRun } from "@interfaces/testrun.interfaces";
import { SafePoint } from "./point.class";

export class TestRun {
	testRunData: ITestRun;
	cases: TestCaseRun[];
	constructor(data?: ITestRun, cases?: TestCaseRun[]) {
		this.testRunData = data;
		this.cases = cases;
	}

	public toPoints(influxDBSchema: InfluxDBSchema, trackTimeOfEmptyCases: boolean): Point[] {
		const runSchema = influxDBSchema.test_run;

		const filter = (value) => trackTimeOfEmptyCases || !this.emptyCasesFilter(value);
		
		let duration = 0;
		this.cases.forEach(value => {
			if (filter(value)) duration += value.caseData.endTime.getTime() - value.caseData.startTime.getTime();
		})

		const runPoint = new SafePoint(runSchema.measurment_name)
			.timestamp(this.testRunData.startTime)
			.intField(runSchema.steps_number, this.testRunData?.stepsNumber ?? 0)
			.intField(runSchema.duration, duration)
			.booleanField(runSchema.is_automation, this.testRunData.isAuto)
			//optional fields
			.safeStringField(runSchema.description, this.testRunData.description)
			.safeStringField(runSchema.title, this.testRunData.title)
			.safeStringField(runSchema.user_id, this.testRunData.userId.toString())
			.safeStringField(runSchema.id, this.testRunData.id.toString())
			.safeStringField(runSchema.enviroment, this.testRunData.enviroment);

		if (influxDBSchema.test_case) {
			const caseEndPoints: Point[] = this.cases.map(value => value.toPoint(influxDBSchema.test_case, this.testRunData.isAuto));
			
			return [runPoint, ...caseEndPoints];
		}
		else {
			return [runPoint];
		}

	}

	private emptyCasesFilter = (value: TestCaseRun) => value.caseData.stepsNumber == 0;
}

export class TestCaseRun {
	caseData: ITestCaseRun;

	constructor(caseData: ITestCaseRun) {
		this.caseData = caseData;
	}

	public toPoint(caseSchema: CaseInfluxDBSchema, isAuto: boolean): Point {
		return new SafePoint(caseSchema.measurment_name)
			.timestamp(this.caseData.startTime)
			.intField(caseSchema.steps_number, this.caseData.stepsNumber)
			.intField(caseSchema.duration, this.caseData.endTime.getTime() - this.caseData.startTime.getTime())
			.booleanField(caseSchema.is_automation, isAuto)
			.intField(caseSchema.automation_status, this.caseData.automationStatus)
			//optional fields
			.safeStringField(caseSchema.id, this.caseData.id.toString())
			.safeStringField(caseSchema.run_id, this.caseData.runId.toString())
			.safeStringField(caseSchema.status, this.caseData.status);
	}
}

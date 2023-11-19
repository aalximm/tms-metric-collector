import { Point } from "@influxdata/influxdb-client";
import { ITestRun } from "@interfaces/testrun.interfaces";
import { Inject, Injectable } from "@nestjs/common";
import { TestRun, TestCaseRun } from "../classes/testrun.class";
import { TmsCase, TmsRun, TmsRunResult } from "../dto/tms.dto";
import { InfluxDBService, Logger, TmsService } from "@services";
import { INFLUX_DB_SERVICE_PROVIDER, LOGGER_PROVIDER, TEST_RUNS_AGREGATOR_MODULE_OPTIONS, TMS_SERVICE_PROVIDER } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { TestRunsAgregatorOptions } from "@interfaces/options/test-runs-agregator.options";

@Injectable()
export class TestRunsAgregatorService {
	private trackTimeOfEmptyCases: boolean;
	constructor(
		@Inject(TEST_RUNS_AGREGATOR_MODULE_OPTIONS) options: TestRunsAgregatorOptions,
		@Inject(TMS_SERVICE_PROVIDER) private tmsService: TmsService,
		@Inject(INFLUX_DB_SERVICE_PROVIDER) private influxDBService: InfluxDBService,
		@Inject(LOGGER_PROVIDER) private logger: ILogger,
	) {
		this.trackTimeOfEmptyCases = options.trackEmptyCases;
		this.logger.initService(this.constructor.name, options);
	}

	public async updateDataBase(code: string): Promise<number> {
		const testRuns: TestRun[] = await this.agregateAllRuns(code);
		const influxDBSchema = this.influxDBService.getSchema();
		const points: Point[] = testRuns.flatMap(run => run.toPoints(influxDBSchema, this.trackTimeOfEmptyCases));
		return await this.influxDBService.savePoints(points);
	}

	private async agregateAllRuns(code: string): Promise<TestRun[]> {
		this.logger.info(`Trying to get all runs from projects ${code}`);

		const runs: TmsRun[] = await this.tmsService.getAllRuns(code);
		this.logger.info(`Runs recivied successfully, count: ${runs.length}`);

		this.logger.info(`Trying to get results from project ${code}`);
		const results = await this.tmsService.getResultsByRuns(code, runs);
		this.logger.info(`Results recieved successfully, count: ${results.length}`);

		const casesId = [...new Set(results.map(res => res.case_id))];

		this.logger.info(`Trying to get cases information from projects ${code}, unique cases number: ${casesId.length}`);
		const cases = await this.tmsService.getCasesById(code, casesId);
		this.logger.info(`Cases information recevied successfully, length: ${cases.length}`);

		const caseStepsMap = {};
		cases.forEach(value => caseStepsMap[value.id] = value.steps?.length ?? 0);

		return runs.map<TestRun>(run => {
			const sortedRunResults: TmsRunResult[] = this.getFilteredResults(results, { runId: run.id })
				.sort(this.sortByEndTimeComparator);
			
			const runCases: TestCaseRun[] = sortedRunResults.map((value, index, array) => {
				return new TestCaseRun({
					startTime: index == 0 ? new Date(run.start_time) : new Date(array[index - 1].end_time),
					endTime: new Date(value.end_time),
					id: value.case_id,
					runId: run.id,
					stepsNumber: caseStepsMap[value.case_id] ?? 0,
					status: value.status,
				});
			}, this);

			let stepsNumber = 0;
			for (let i = 0; i < runCases.length; i++) {
				stepsNumber += runCases[i].caseData.stepsNumber;
			}

			const runData: ITestRun = {
				startTime: new Date(run.start_time),
				endTime: new Date(run.end_time),
				isAuto: this.checkAutomation(run),
				id: run.id,
				stepsNumber: stepsNumber,
				title: run.title,
				description: run.description,
				userId: run.user_id,
				enviroment: run?.environment?.title,
			};
			const testRun = new TestRun(runData, runCases);
			return testRun;
		}, this);
	}

	private getFilteredResults(results: TmsRunResult[], options: { runId?: number; caseId?: number }): TmsRunResult[] {
		const checkCaseId = (caseId: number) => {
			return options.caseId ? caseId == options.caseId : true;
		};
		const checkRunId = (runId: number) => {
			return options.runId ? runId == options.runId : true;
		};
		return results.filter(value => checkCaseId(value.case_id) && checkRunId(value.run_id));
	}

	private sortByEndTimeComparator = (a: TmsRunResult, b: TmsRunResult) => {
		return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
	}

	private checkAutomation(run: TmsRun): boolean {
		return this.automationRunDescriptionRegExp.test(run.description);
	}

	private automationRunDescriptionRegExp = /Playwright/;
}

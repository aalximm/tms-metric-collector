import { BUCKET_SIZE } from "@constants/test-run-agregator.constants";
import { Point } from "@influxdata/influxdb-client";
import { ITestRun } from "@interfaces/testrun.interfaces";
import { Inject, Injectable } from "@nestjs/common";
import { TestRun, TestCaseRun } from "../classes/testrun.classes";
import { TmsRun, TmsRunResult } from "../dto/tms.dto";
import { InfluxDBService, TmsService } from "@services";
import { INFLUX_DB_SERVICE_PROVIDER, LOGGER_PROVIDER, TMS_SERVICE_PROVIDER } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";

@Injectable()
export class TestRunsAgregatorService {
	constructor(
		@Inject(TMS_SERVICE_PROVIDER) private tmsService: TmsService,
		@Inject(INFLUX_DB_SERVICE_PROVIDER) private influxDBService: InfluxDBService,
		@Inject(LOGGER_PROVIDER) private logger: ILogger,
	) {
		this.logger.setContext(this.constructor.name);
		this.logger.info("Init tms-tuns-agregator service");
	}

	public async updateDataBase(code: string, options: { limit: number; offset: number }): Promise<number> {
		const testRuns: TestRun[] = await this.agregateRuns(code, { limit: options.limit, offset: options.offset });
		const points: Point[] = testRuns.flatMap(run => run.toPoints());
		return await this.influxDBService.savePoints(points);
	}

	private async agregateRuns(code: string, options: { offset: number; limit: number }): Promise<TestRun[]> {
		this.logger.info(`Trying to get runs from projects ${code} with params:\noffset: ${options.offset}, limit: ${options.limit}`);

		const runs: TmsRun[] = await this.tmsService.getRuns(code, {
			limit: options.limit,
			offset: options.offset,
			status: "complete",
		});
		this.logger.info(`Runs recivied successfully, count: ${runs.length}`);

		this.logger.info(`Trying to get results from project ${code}`);
		const results = await this.tmsService.getResultsByRuns(code, runs, BUCKET_SIZE);
		this.logger.info(`Results recieved successfully, count: ${results.length}`);

		const casesId = [...new Set(results.map(res => res.case_id))];

		this.logger.info(`Trying to get cases information from projects ${code}, unique cases number: ${casesId.length}`);
		const cases = await this.tmsService.getCasesById(code, casesId);
		this.logger.info(`Cases information recevied successfully`);

		const caseStepsMap: Map<number, number> = new Map();
		cases.forEach(value => caseStepsMap.set(value.id, value?.steps ? value.steps.length : null));

		return runs.map<TestRun>(run => {
			const sortedRunResults: TmsRunResult[] = this.getFilteredResults(results, { runId: run.id }).sort(
				(a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime(),
			);
			const runCases: TestCaseRun[] = sortedRunResults.map((value, index, array) => {
				return new TestCaseRun({
					startTime: index == 0 ? new Date(run.start_time) : new Date(array[index - 1].end_time),
					endTime: new Date(value.end_time),
					id: value.case_id,
					runId: run.id,
					stepsNumber: caseStepsMap.get(value.case_id) ?? 0,
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
				id: run.id,
				stepsNumber: stepsNumber,
				title: run.title,
				description: run.description,
				userId: run.user_id,
				enviroment: run?.environment?.title,
			};
			return new TestRun(runData, runCases);
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
}

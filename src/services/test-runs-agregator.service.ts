import { Point } from "@influxdata/influxdb-client";
import { ITestRun } from "@interfaces/testrun.interfaces";
import { Inject, Injectable } from "@nestjs/common";
import { TestRun, TestCaseRun } from "../classes/testrun.class";
import { TmsCase, TmsRun, TmsRunResult, TmsStep } from "../dto/tms.dto";
import { InfluxDBService, TmsService } from "@services";
import { INFLUX_DB_SERVICE_PROVIDER, LOGGER_PROVIDER, TEST_RUNS_AGREGATOR_MODULE_OPTIONS, TMS_SERVICE_PROVIDER } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { TestRunsAgregatorOptions } from "@interfaces/options/test-runs-agregator.options";
import { Iterable } from "@interfaces/iterable.interface";

@Injectable()
export class TestRunsAgregatorService {
	private trackTimeOfEmptyCases: boolean;
	private recursiveCountingOfSteps: boolean;
	private initialOffset: number;
	constructor(
		@Inject(TEST_RUNS_AGREGATOR_MODULE_OPTIONS) options: TestRunsAgregatorOptions,
		@Inject(TMS_SERVICE_PROVIDER) private tmsService: TmsService,
		@Inject(INFLUX_DB_SERVICE_PROVIDER) private influxDBService: InfluxDBService,
		@Inject(LOGGER_PROVIDER) private logger: ILogger,
	) {
		this.trackTimeOfEmptyCases = options.trackEmptyCases;
		this.recursiveCountingOfSteps = options.recursiveCountingOfSteps;
		this.initialOffset = options.initialOffset;
		this.logger.initService(this.constructor.name, options);
	}

	public async loadRunsToDatabase(code: string): Promise<void> {
		const runsIterator = new (this.getRunsIterator())(200, code);
		const schema = this.influxDBService.getSchema();
		await runsIterator.init();

		while (await runsIterator.hasNext()) {
			const tmsRuns: TmsRun[] = await runsIterator.next();
			const testRuns: TestRun[] = await this.extractResults(code, tmsRuns);
			const points: Point[] = testRuns.flatMap(run => run.toPoints(schema, this.trackTimeOfEmptyCases));

			await this.influxDBService.savePoints(points);
		}
	}

	public async loadCasesToDatabase(code: string): Promise<number> {
		const cases: TmsCase[] = await this.tmsService.getAllCases(code);
		this.logger.info(`Loaded ${cases.length} cases`);

		const schema = this.influxDBService.getSchema().backlog_case;
		const points: Point[] = cases.map(tmsCase => {
			return new Point(schema.measurment_name)
				.stringField(schema.case_name, tmsCase.title)
				.stringField(schema.id, tmsCase.id)
				.stringField(schema.automation_status, tmsCase.automation.toString() ?? -1)
				.intField(schema.steps_number, this.getStepsNumber(tmsCase, this.recursiveCountingOfSteps));
		});
		return await this.influxDBService.savePoints(points);
	}

	private async extractResults(code: string, runs: TmsRun[]): Promise<TestRun[]> {

		this.logger.info('Trying to fetch results');
		const results = await this.tmsService.getResultsByRuns(code, runs);
		this.logger.info('Results fetched succsessfuly, count: ' + results.length);

		this.logger.info('Trying to fetch cases');
		const casesId = [...new Set(results.map(res => res.case_id))];
		const cases = await this.tmsService.getCasesById(code, casesId);
		this.logger.info('Cases fetched succsessfuly');

		const recievedCasesId = cases.map(c => c.id);
		const dif = casesId.filter(c => !recievedCasesId.includes(c));
		this.logger.warn(`Cases were not recieved: ${JSON.stringify(dif)}`);

		const caseDataMap = new Map<number, { stepsNumber: number; automationStatus: number }>();
		cases.forEach(value => caseDataMap.set(value.id, { stepsNumber: this.getStepsNumber(value, true), automationStatus: value.automation }));

		const emptyCases = Array.from(caseDataMap.entries())
			.filter(([, value]) => value.stepsNumber == 0)
			.map(([key]) => key);
		this.logger.warn(`These cases are empty: ${JSON.stringify(emptyCases)}`);

		return runs.map<TestRun>(run => {
			const sortedRunResults: TmsRunResult[] = this.getFilteredResults(results, { runId: run.id }).sort(this.sortByEndTimeComparator);

			const runCases: TestCaseRun[] = sortedRunResults.map((value, index, array) => {
				return new TestCaseRun({
					startTime: index == 0 ? new Date(run.start_time) : new Date(array[index - 1].end_time),
					endTime: new Date(value.end_time),
					id: value.case_id,
					runId: run.id,
					stepsNumber: caseDataMap.get(value.case_id) ? caseDataMap.get(value.case_id).stepsNumber : 0,
					status: value.status,
					automationStatus: caseDataMap.get(value.case_id) ? caseDataMap.get(value.case_id).automationStatus : -1,
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
		this.logger.verbose(`Sorting with params: runId ${options.runId}, caseId ${options.caseId}`);
		const checkCaseId = (caseId: number) => {
			return options.caseId ? caseId == options.caseId : true;
		};
		const checkRunId = (runId: number) => {
			return options.runId ? runId == options.runId : true;
		};
		const sortedResults = results.filter(value => checkCaseId(value.case_id) && checkRunId(value.run_id));
		this.logger.verbose(`Results length after sorting: ${sortedResults.length}`);
		return sortedResults;
	}

	private getStepsNumber(stepful: { steps: TmsStep[] }, isCase: boolean): number {
		if (!this.recursiveCountingOfSteps) return stepful.steps.length;
		if (stepful.steps && stepful.steps.length == 0) return isCase ? 0 : 1;

		let result = 0;
		for (let i = 0; i < stepful.steps.length; i++) {
			result += this.getStepsNumber(stepful.steps[i], false);
		}
		return result;
	}

	private sortByEndTimeComparator = (a: TmsRunResult, b: TmsRunResult) => {
		return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
	};

	private checkAutomation(run: TmsRun): boolean {
		return this.automationRunDescriptionRegExp.test(run.description);
	}

	private automationRunDescriptionRegExp = /Playwright/;

	private getRunsIterator = () => {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const $outer = this;

		class RunsIterator implements Iterable<TmsRun> {
			private readonly tmsService: TmsService;
			private readonly logger: ILogger;
			private maxPosition: number;
			private currentPosition: number;

			constructor(private bucketSize: number, private code: string) {
				this.tmsService = $outer.tmsService;
				this.logger = $outer.logger;
			}

			public async hasNext(): Promise<boolean> {
				return this.currentPosition < this.maxPosition;
			}

			public async next(): Promise<TmsRun[]> {
				this.logger.info(`Trying to fetch runs from ${this.currentPosition} to ${Math.min(this.maxPosition, this.currentPosition + this.bucketSize)}`);

				const results = await this.tmsService.getAllRuns(this.code, this.currentPosition, Math.min(this.maxPosition, this.currentPosition + this.bucketSize));

				this.logger.info('Runs fetched succsessfuly, count: ' + results.length);

				this.currentPosition += this.bucketSize;

				return results;
			}

			public async init(): Promise<void> {
				[, this.maxPosition] = await this.tmsService.getRuns(this.code, { offset: 0, limit: 1 });
				this.currentPosition = 0;
			}
		}

		return RunsIterator;
	};
}

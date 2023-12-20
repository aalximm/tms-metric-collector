import { Inject, Injectable } from "@nestjs/common";
import { TmsOptions } from "@interfaces/options/tms.options";
import { TMS_GET_CASE_BY_ID_EP, TMS_GET_CASE_EP, TMS_GET_RESULTS_EP, TMS_GET_RUN_EP } from "@constants/tms.endpoints";
import axios, { AxiosError, AxiosInstance } from "axios";
import { TmsApiResponse, TmsList, TmsRun, TmsRunResult, TmsCase } from "../dto/tms.dto";
import { TmsException } from "@exceptions";
import { LOGGER_PROVIDER, TMS_MODULE_OPTIONS } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";

@Injectable()
export class TmsService {
	private axiosInstance: AxiosInstance;
	private bucketSize: number;

	constructor(@Inject(TMS_MODULE_OPTIONS) options: TmsOptions, @Inject(LOGGER_PROVIDER) private logger: ILogger) {
		this.bucketSize = options.bucketSize;

		this.axiosInstance = axios.create({
			baseURL: options.baseUrl,
			headers: {
				Token: options.token,
			},
		});

		this.axiosInstance.interceptors.request.use(
			config => {
				logger.debug(`Outgoing request:\n${JSON.stringify(config, null, 2)}`);
				return config;
			},
			(err: AxiosError) => {
				logger.error(`Request error: ${JSON.stringify(err.toJSON())}`, err.stack);
				return Promise.reject(new TmsException(err));
			},
		);

		this.axiosInstance.interceptors.response.use(
			response => {
				logger.debug(
					`Incoming response: \nUrl: ${response.config.baseURL}${response.config.url}\nHeaders: ${response.headers}\nStatus: ${response.status}\nBody: ${JSON.stringify(
						response.data,
						null,
						2,
					)}`,
				);
				return response;
			},
			// (err: AxiosError) => {
			// 	logger.error(`Incoming response error: ${JSON.stringify(err.toJSON())}`, err.stack);
			// 	return Promise.reject(new TmsException(err));
			// },
		);

		this.logger.initService(this.constructor.name, options);
	}

	public async getResultsByRuns(code: string, runs: TmsRun[]): Promise<TmsRunResult[]> {
		const runsId = runs.map(run => run.id);
		const tasks: Promise<TmsRunResult[]>[] = [];

		const [, total] = await this.getResults(code, { runs: runsId, offset: 0, limit: 1 });

		for (let offset = 0; offset < total; offset += this.bucketSize) {
			tasks.push(this.getResults(code, { runs: runsId, offset: offset, limit: this.bucketSize }).then(([result]) => result));
		}

		return Promise.all(tasks).then(results => [].concat(...results));
	}

	public async getAllRuns(code: string, initialOffset?: number): Promise<TmsRun[]> {
		const tasks: Promise<TmsRun[]>[] = [];

		const [, total] = await this.getRuns(code, { offset: 0, limit: 1 });
		this.logger.info(`Runs total: ${total}`);

		for (let offset = initialOffset ?? 0; offset < total; offset += this.bucketSize) {
			tasks.push(this.getRuns(code, { offset: offset, limit: this.bucketSize }).then(([result]) => result));
		}

		return Promise.all(tasks).then(results => [].concat(...results));
	}

	public async getCasesById(code: string, casesId: number[]): Promise<TmsCase[]> {
		const tasks: Promise<TmsCase>[] = [];
		casesId.forEach(caseId => tasks.push(this.getCaseById(code, caseId).catch(err => null)));
		return Promise.all(tasks).then(results => [].concat(results.filter(res => res != null)));
	}

	public async getAllCases(code: string, initialOffset=0): Promise<TmsCase[]> {
		const tasks: Promise<TmsCase[]>[] = [];

		const [, total] = await this.getCases(code, { offset: 0, limit: 1 });
		this.logger.info(`Runs total: ${total}`);

		for (let offset = initialOffset ?? 0; offset < total; offset += this.bucketSize) {
			tasks.push(this.getCases(code, { offset: offset, limit: this.bucketSize }).then(([result]) => result));
		}

		return Promise.all(tasks).then(results => [].concat(...results));
	}

	private async getCases(code: string, filterOptions?: { limit?: number; offset?: number }): Promise<[TmsCase[], number]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsCase>>>(TMS_GET_CASE_EP(code), {
			params: {
				limit: filterOptions?.limit ?? 10,
				offset: filterOptions?.offset ?? 0,
			},
		});

		const entities: TmsCase[] = response.data.result.entities;
		const count: number = response.data.result.filtered;
		entities.forEach(ent => {
			this.logger.verbose(`Case ${ent.id}, steps number ${ent.steps.length}`);
		});
		return [entities, count];
	}

	private async getCaseById(code: string, caseId: number): Promise<TmsCase> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsCase>>(TMS_GET_CASE_BY_ID_EP(code, caseId));
		return response.data.result;
	}

	private async getRuns(code: string, options: { limit: number; offset: number; status?: string }): Promise<[TmsRun[], number]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsRun>>>(TMS_GET_RUN_EP(code), {
			params: {
				limit: options.limit,
				offset: options.offset,
				status: options.status,
			},
		});
		const entities: TmsRun[] = response.data.result.entities;
		const count: number = response.data.result.filtered;
		entities.forEach(ent => {
			this.logger.verbose(`Run: ${ent.id}, startTime ${ent.start_time}, endTime ${ent.end_time}`);
		});
		return [entities, count];
	}

	private async getResults(
		code: string,
		filterOptions?: {
			runs?: number[];
			limit?: number;
			offset?: number;
		},
	): Promise<[TmsRunResult[], number]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsRunResult>>>(TMS_GET_RESULTS_EP(code), {
			params: {
				run: filterOptions?.runs?.join(",") ?? null,
				limit: filterOptions?.limit ?? null,
				offset: filterOptions?.offset ?? null,
			},
		});
		const entities: TmsRunResult[] = response.data.result.entities;
		const count: number = response.data.result.total;
		entities.forEach(ent => {
			this.logger.verbose(`Result: run ${ent.run_id}, case ${ent.case_id}, endTime ${ent.end_time}`);
		});
		return [entities, count];
	}
}

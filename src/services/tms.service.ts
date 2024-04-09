import { Inject, Injectable } from "@nestjs/common";
import { TmsOptions } from "@interfaces/options/tms.options";
import { TMS_GET_CASE_BY_ID_EP, TMS_GET_CASE_EP, TMS_GET_RESULTS_EP, TMS_GET_RUN_EP } from "@constants/tms.endpoints";
import axios, { AxiosError, AxiosInstance } from "axios";
import { TmsApiResponse, TmsList, TmsRun, TmsRunResult, TmsCase } from "../dto/tms.dto";
import { TmsException } from "@exceptions";
import { BUCKET_EXECUTOR_SERVICE_PROVICER as BUCKET_EXECUTOR_SERVICE_PROVIDER, LOGGER_PROVIDER, TMS_MODULE_OPTIONS } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { BucketExecutorService } from "./bucketexecutor.service";
import { Iterable } from "@interfaces/iterable.interface";

@Injectable()
export class TmsService {
	private axiosInstance: AxiosInstance;
	public bucketSize: number;

	constructor(
		@Inject(TMS_MODULE_OPTIONS) options: TmsOptions,
		@Inject(LOGGER_PROVIDER) private logger: ILogger,
		@Inject(BUCKET_EXECUTOR_SERVICE_PROVIDER) private bucketExecutor: BucketExecutorService,
	) {
		this.bucketSize = options.bucketSize;

		this.axiosInstance = axios.create({
			baseURL: options.baseUrl,
			headers: {
				Token: options.token,
			},
		});

		this.axiosInstance.interceptors.request.use(
			config => {
				logger.debug(
					`Outgoing request:\n${JSON.stringify(
						{
							method: config.method ?? "none",
							baseUrl: config.baseURL ?? "none",
							params: config.params ?? "none",
							date: config.data ?? "none",
						},
						null,
						2,
					)}`,
				);
				return config;
			},
			(err: AxiosError) => {
				logger.error(`Request error: ${JSON.stringify(err.message)}`);
				return new TmsException(err);
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
			(err: AxiosError) => {
				logger.warn(`${err.message}:\nurl: ${err.config.baseURL + err.config.url}\nparams: ${JSON.stringify(err.config.params) ?? "none"}`);
				return Promise.reject(new TmsException(err));
			},
		);

		this.logger.initService(this.constructor.name, options);
	}

	public async getResultsByRuns(code: string, runs: TmsRun[]): Promise<TmsRunResult[]> {
		const runsId = runs.map(run => run.id).sort();
		const tasks: Promise<TmsRunResult[]>[] = [];

		const [, total] = await this.getResults(code, { runs: runsId, offset: 0, limit: 1 });

		for (let offset = 0; offset < total; offset += this.bucketSize) {
			tasks.push(this.getResults(code, { runs: runsId, offset: offset, limit: this.bucketSize }).then(([result]) => result));
		}

		return await this.bucketExecutor.executeAll(tasks, `results for run ids [${runsId[0]} ... ${runsId.at(-1)}] loading`);
	}

	public async getAllRuns(code: string, from: number, to: number): Promise<TmsRun[]> {
		const tasks: Promise<TmsRun[]>[] = [];

		for (let offset = from; offset < to; offset += Math.min(this.bucketSize, to - offset)) {
			tasks.push(this.getRuns(code, { offset: offset, limit: Math.min(this.bucketSize, to - offset) }).then(([result]) => result));
		}

		return await this.bucketExecutor.executeAll(tasks, `runs ${from} - ${to} loading`);
	}

	public async getCasesById(code: string, casesId: number[]): Promise<TmsCase[]> {
		const tasks: Promise<TmsCase[]>[] = [];

		casesId.sort();

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const $outer = this;

		const generator = new class implements Iterable<Promise<TmsCase[]>> {

			private i = 0;
			private outer = $outer;

			hasNext(): boolean | Promise<boolean> {
				return this.i < casesId.length;
			}

			next(): Promise<TmsCase[]>[] {
				const tasks: Promise<TmsCase[]>[] = [];
				tasks.push(this.outer.getCaseById(code, casesId[this.i])
					.then(res => [res])
					.catch(err => <TmsCase[]>[]));
				this.i++;
				return tasks;
			}
		}();

		return await this.bucketExecutor.executeAllFromGenerator(generator, `cases loading by id [${casesId[0]} ... ${casesId.at(-1)}]`);
	}

	public async getAllCases(code: string, initialOffset = 0): Promise<TmsCase[]> {
		const tasks: Promise<TmsCase[]>[] = [];

		const [, total] = await this.getCases(code, { offset: 0, limit: 1 });
		this.logger.info(`Cases total: ${total}`);

		for (let offset = initialOffset ?? 0; offset < total; offset += this.bucketSize) {
			tasks.push(this.getCases(code, { offset: offset, limit: this.bucketSize }).then(([result]) => result));
		}

		return await this.bucketExecutor.executeAll(tasks, "all cases loading");
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

		return [entities, count];
	}

	private async getCaseById(code: string, caseId: number): Promise<TmsCase> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsCase>>(TMS_GET_CASE_BY_ID_EP(code, caseId));
		return response.data.result;
	}

	public async getRuns(code: string, options: { limit: number; offset: number; status?: string }): Promise<[TmsRun[], number]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsRun>>>(TMS_GET_RUN_EP(code), {
			params: {
				limit: options.limit,
				offset: options.offset,
				status: options.status,
			},
		});
		const entities: TmsRun[] = response.data.result.entities;
		const count: number = response.data.result.filtered;
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

		return [entities, count];
	}
}

import { Inject, Injectable } from "@nestjs/common";
import { TmsOptions } from "@interfaces/options/tms.options";
import { TMS_GET_AUTHOR_EP, TMS_GET_CASE_EP, TMS_GET_PROJECT_EP, TMS_GET_RESULTS_EP, TMS_GET_RUN_EP } from "@constants/tms.endpoints";
import axios, { AxiosError, AxiosInstance } from "axios";
import { TmsProject, TmsApiResponse, TmsAuthor, TmsList, TmsRun, TmsRunResult, TmsCase } from "../dto/tms.dto";
import { TmsException } from "@exceptions";
import { getBuckets } from "@utils";
import { LOGGER_PROVIDER, TMS_MODULE_OPTIONS } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";

@Injectable()
export class TmsService {
	private axiosInstance: AxiosInstance;
	private trackedRunStatus: string;
	private bucketSize: number;

	constructor(@Inject(TMS_MODULE_OPTIONS) options: TmsOptions, @Inject(LOGGER_PROVIDER) private logger: ILogger) {
		this.bucketSize = options.bucketSize;
		this.trackedRunStatus = options.trackedRunsStatus;

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
			(err: AxiosError) => {
				logger.error(`Incoming response error: ${JSON.stringify(err.toJSON())}`, err.stack);
				return Promise.reject(new TmsException(err));
			},
		);

		this.logger.initService(this.constructor.name, options);
	}

	public async getProjectByCode(code: string): Promise<TmsProject> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsProject>>(TMS_GET_PROJECT_EP(code));
		return response.data.result;
	}

	public async getAuthorsByType(type: string): Promise<TmsAuthor[]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsAuthor>>>(TMS_GET_AUTHOR_EP, {
			params: {
				type: type,
			},
		});
		return response.data.result.entities;
	}

	public async getResults(
		code: string,
		filterOptions?: {
			runs?: number[];
			limit?: number;
			offset?: number;
		},
	): Promise<TmsRunResult[]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsRunResult>>>(TMS_GET_RESULTS_EP(code), {
			params: {
				limit: filterOptions?.limit ?? 10,
				offset: filterOptions?.offset ?? 0,
				run: filterOptions?.runs?.join(",") ?? null,
			},
		});
		return response.data.result.entities;
	}

	public async getResultsByRuns(code: string, runs: TmsRun[]): Promise<TmsRunResult[]> {
		const tasks = runs.map(run => {
			const subtasks: Promise<TmsRunResult[]>[] = [];
			for (let offset = 0; offset < run.stats.total; offset += this.bucketSize) {
				subtasks.push(this.getResults(code, { runs: [run.id], limit: this.bucketSize, offset }));
			}
			return Promise.all(subtasks).then<TmsRunResult[]>(subtaskResults => [].concat(...subtaskResults));
		});
		return Promise.all(tasks).then<TmsRunResult[]>(taskResults => [].concat(...taskResults));
	}

	private async getRuns(code: string, options: { limit: number; offset: number; status: string }): Promise<TmsRun[]> {
		const response = await this.axiosInstance
			.get<TmsApiResponse<TmsList<TmsRun>>>(TMS_GET_RUN_EP(code), {
				params: {
					limit: options.limit,
					offset: options.offset,
					status: options.status,
				},
			});
		return response.data.result.entities;
	}

	public async getAllRuns(code): Promise<TmsRun[]> {
		const runs = [];
		let response = null;
		let offset = 0;
		do {
			response = await this.getRuns(code, { offset, limit: this.bucketSize, status: this.trackedRunStatus })
			runs.push(...response);
			offset += this.bucketSize;
		} while (response?.length != 0)

		return runs;
	}

	public async getCases(code: string, filterOptions?: { limit?: number; offset?: number }): Promise<TmsCase[]> {
		const response = await this.axiosInstance.get<TmsApiResponse<TmsList<TmsCase>>>(TMS_GET_CASE_EP(code), {
			params: {
				limit: filterOptions?.limit ?? 10,
				offset: filterOptions?.offset ?? 0,
			},
		});
		return response.data.result.entities;
	}

	public async getCasesById(code: string, casesId: number[]): Promise<TmsCase[]> {
		const buckets: { startOfBucket: number; bucketSize: number }[] = getBuckets(casesId, this.bucketSize);
		const tasks = buckets.map(bucket =>
			this.getCases(code, { limit: bucket.bucketSize, offset: bucket.startOfBucket }).then((cases: TmsCase[]) => cases.filter(value => casesId.includes(value.id))),
		);
		return Promise.all(tasks).then<TmsCase[]>((results: TmsCase[][]) => [].concat(...results));
	}
}

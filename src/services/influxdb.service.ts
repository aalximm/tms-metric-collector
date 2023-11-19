import { Inject, Injectable } from "@nestjs/common";
import { InfluxDBOptions } from "@interfaces/options/influxdb.options";
import { InfluxDB, Point, QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { InfluxDBError } from "@exceptions";
import { INFLUX_DB_MODULE_OPTIONS, LOGGER_PROVIDER } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { InfluxDBSchema } from "@interfaces/influxdb.schema";

@Injectable()
export class InfluxDBService {
	private schema: InfluxDBSchema;
	private bucket: string;
	private org: string;
	private bucketSizeOnFlush: number;
	private client: InfluxDB;
	private writeClient: WriteApi;
	private queryClient: QueryApi;

	constructor(@Inject(INFLUX_DB_MODULE_OPTIONS) options: InfluxDBOptions, @Inject(LOGGER_PROVIDER) private logger: ILogger) {
		this.org = options.org;
		this.bucket = options.bucket;
		this.schema = options.schema;
		this.bucketSizeOnFlush = options.bucketSizeOnFlush;

		this.client = new InfluxDB({
			url: options.url,
			token: options.token,
		});
		this.writeClient = this.client.getWriteApi(options.org, options.bucket, "ns");
		this.queryClient = this.client.getQueryApi(options.org);

		this.logger.initService(this.constructor.name, options);
	}

	private async checkConnection(): Promise<boolean> {
		let isConnected = false;
		try {
			const query = `buckets()`;
			const result = await this.queryClient.collectRows(query);
			if (result && result.length) isConnected = true;
		} catch (err) {
			this.logger.error(err);
			isConnected = false;
		} finally {
			return isConnected;
		}
	}

	public async tryToConnect(attempts: number) {
		for (let i = 0; i < attempts; i++) {
			this.logger.info(`Trying to connect to influxdb, attempt ${i}`);
			if (await this.checkConnection()) return;
			else await new Promise(resolve => setTimeout(resolve, 1000));
		}
		throw new InfluxDBError("Не удается подключиться к influxDB");
	}

	public getSchema(): InfluxDBSchema {
		return this.schema;
	}

	public async savePoints(points: Point[]): Promise<number> {
		this.logger.info(`Trying to save Points, count: ${points.length}`);
		this.logger.debug(JSON.stringify(points));
		for (let i = 0; i < points.length; i += this.bucketSizeOnFlush) {
			this.writeClient.writePoints(points.slice(i, Math.min(i + this.bucketSizeOnFlush, points.length)));
			await this.writeClient.flush().catch(err => {
				throw new InfluxDBError(err);
			});
		}
		this.logger.info(`Points saved successfully`);
		return points.length;
	}

	public async getLastTestRun(measurmentName: string, daysAgo: number): Promise<{ runId: number; date: Date } | null> {
		const query = `from(bucket: "${this.bucket}") 
		|> range(start: -${daysAgo}d, stop: now())
		|> filter(fn: (r) => r._measurement == "${measurmentName}") 
		|> last()`;
		this.logger.info(`Trying to get Points`);
		const result = await this.queryClient.collectRows<any>(query).catch(err => {
			this.logger.error(err);
			throw new InfluxDBError("Ошибка при получении данных от influxDB", err);
		});

		this.logger.info(`Last test run point was recieved successfully: ${JSON.stringify(result[0])}`);
		if (result.length > 0) return { runId: result[0].id, date: new Date(result[0].time) };

		this.logger.warn("Couldnt find the latest test run point time");
		return null;
	}
}

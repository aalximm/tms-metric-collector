import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InfluxDBOptions } from "../interfaces/influxdb.interfaces";
import { InfluxDB, Point, QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { INFLUX_DB_MODULE_OPTIONS } from "../constants/influxdb.constants";
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from "nest-winston";
import { InfluxDBError } from "src/exceptions/influxdb.exception";

@Injectable()
export class InfluxDBService {
	private client: InfluxDB;
	private options: InfluxDBOptions;
	private writeClient: WriteApi;
	private queryClient: QueryApi;

	constructor(@Inject(INFLUX_DB_MODULE_OPTIONS) options: InfluxDBOptions, @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: WinstonLogger) {
		this.options = options;

		this.logger = logger;
		this.logger.setContext(this.constructor.name);

		this.client = new InfluxDB({
			url: options.url,
			token: options.token,
		});
		this.writeClient = this.client.getWriteApi(options.org, options.bucket, "ns");
		this.queryClient = this.client.getQueryApi(options.org);
	}

	public async savePoints(points: Point[]): Promise<number> {
		this.logger.log(`Trying to save Points, count: ${points.length}`);
		this.logger.debug(JSON.stringify(points));
		for (let i = 0; i < points.length; i += 500) {
			this.writeClient.writePoints(points.slice(i, i + 500 >= points.length ? points.length : i + 500));
			await this.writeClient
				.flush()
				.catch(err => {
					throw new InfluxDBError(err);
				});
		}
		return points.length;
	}

	public async getLastTestRun(measurmentName: string, daysAgo: number): Promise<{ runId: number; date: Date } | null> {
		const query = `from(bucket: "${this.options.bucket}") 
		|> range(start: -${daysAgo}d, stop: now())
		|> filter(fn: (r) => r._measurement == "${measurmentName}") 
		|> last()`;
		this.logger.log(`Trying to get Points`);
		const result = await this.queryClient.collectRows<{ id: number; time: Date }>(query).catch(err => {
			throw new InfluxDBError(err);
		});

		this.logger.log(`Last test run point was recieved successfully: ${JSON.stringify(result[0])}`);
		if (result.length > 0) return { runId: result[0].id, date: new Date(result[0].time) };

		this.logger.warn("Couldnt find the latest test run point time");
		return null;
	}
}

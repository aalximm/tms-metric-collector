import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InfluxDBOptions } from "../interfaces/influxdb.interfaces";
import { InfluxDB, Point, QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { INFLUX_DB_DEFAULT_PREVIOUS_DAYS, INFLUX_DB_MODULE_OPTIONS } from "../constants/influxdb.constants";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { getDateNDaysAgo } from "src/utils/date.util";
import { TestRun } from "src/interfaces/testrun.classes";
import { InfluxDBError } from "src/exceptions/influxdb.exception";

@Injectable()
export class InfluxDBService {
	private client: InfluxDB;
	private options: InfluxDBOptions;
	private writeClient: WriteApi;
	private queryClient: QueryApi;

	constructor(@Inject(INFLUX_DB_MODULE_OPTIONS) options: InfluxDBOptions, @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService) {
		this.options = options;
		this.logger = logger;
		this.client = new InfluxDB({
			url: options.url,
			token: options.token,
		});
		this.writeClient = this.client.getWriteApi(options.org, options.bucket, "ns");
		this.queryClient = this.client.getQueryApi(options.org);
	}

	public async addSimplePoint(): Promise<void> {
		const point = new Point(this.options.measurementName).tag("runId", "1");

		this.writeClient.writePoint(point);
		this.logger.debug(`Trying to write Point: ${JSON.stringify(point)}`, InfluxDBService.name);
		await this.writeClient.flush();
	}

	public async savePoints(points: Point[]): Promise<number>{
		this.logger.log(`Trying to save Points, count: ${points.length}`, InfluxDBService.name);
		this.logger.debug(JSON.stringify(points), InfluxDBService.name);
		for (let i = 0; i < points.length; i += 500){
			this.writeClient.writePoints(points.slice(i, i + 500 >= points.length ? points.length : i + 500));
			await this.writeClient.flush()
				.then(this.logger.log(`Save points successfully, started from index: ${i}`))
				.catch((err) => new InfluxDBError(err));
		}
		return points.length;
	}

	public async getLastTestRun(daysAgo: number): Promise<{runId?: number, date: Date}> {
		const query = `from(bucket: "${this.options.bucket}") 
		|> range(start: -${daysAgo}d, stop: now())
		|> filter(fn: (r) => r._measurement == "${this.options.measurementName}") 
		|> last()`;
		this.logger.log(`Trying to get Points`, InfluxDBService.name);
		const result = await this.queryClient.collectRows<any>(query);
		
		this.logger.log(`Last test run point was recieved successfully: ${JSON.stringify(result[0])}`, InfluxDBService.name);
		if (result.length > 0)
			return { runId: result[0]._runId, date: new Date(result[0]._time) };
		
		this.logger.warn(`Couldnt find the latest test run point time, use -${daysAgo} days instead`, InfluxDBService.name);
		return { date: getDateNDaysAgo(daysAgo) };
	}
}

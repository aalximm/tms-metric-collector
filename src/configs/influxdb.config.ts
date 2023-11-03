import { ConfigService } from "@nestjs/config";
import { InfluxDBOptions } from "src/interfaces/influxdb.interfaces";

export const getInfluxDBConfig = (configService: ConfigService): InfluxDBOptions => {
	return {
		token: configService.get<string>("INFLUXDB_TOKEN"),
		url: configService.get<string>("INFLUXDB_URL"),
		org: configService.get<string>("INFLUXDB_ORG"),
		bucket: configService.get<string>("INFLUXDB_BUCKET"),
	};
};

import { InfluxDBOptions } from "@interfaces/options/influxdb.options";
import { IConfig } from "@interfaces/options/module.options";

export const getInfluxDBConfig: IConfig<InfluxDBOptions> = (configService) => {
	return {
		token: configService.get<string>("INFLUXDB_TOKEN"),
		url: configService.get<string>("INFLUXDB_URL"),
		org: configService.get<string>("INFLUXDB_ORG"),
		bucket: configService.get<string>("INFLUXDB_BUCKET"),
	};
};

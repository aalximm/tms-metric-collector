import { InfluxDBSchema } from "@interfaces/influxdb.schema";

export interface InfluxDBOptions {
	token: string;
	url: string;
	org: string;
	bucket: string;
	schema: InfluxDBSchema;
	bucketSizeOnFlush: number;
}
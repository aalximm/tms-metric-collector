import { ModuleMetadata } from "@nestjs/common";

export interface InfluxDBModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'>{
	useFactory?: (...args: any[]) => Promise<InfluxDBOptions> | InfluxDBOptions;
    inject?: any[];
}

export interface InfluxDBOptions {
	token: string;
	url: string;
	org: string;
	bucket: string;
	measurementName: string;
}
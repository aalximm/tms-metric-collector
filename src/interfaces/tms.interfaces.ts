import { ModuleMetadata } from "@nestjs/common";

export interface TmsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'>{
	useFactory?: (...args: any[]) => Promise<TmsOptions> | TmsOptions;
    inject?: any[];
}

export interface TmsOptions {
	token: string;
}
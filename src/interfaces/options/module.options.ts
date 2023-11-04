import { ModuleMetadata } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface IModuleAsyncOptions<T> extends Pick<ModuleMetadata, 'imports'>{
	useFactory?: (...args: any[]) => Promise<T> | T;
    inject?: any[];
}

export type IConfig<T> = (configService: ConfigService) => T;
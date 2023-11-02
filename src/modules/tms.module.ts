import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { TmsService } from "../services/tms.service";
import { TmsModuleAsyncOptions } from "../interfaces/tms.interfaces";
import { TMS_MODULE_OPTIONS } from "../constants/tms.constants";

@Global()
@Module({})
export class TmsModule {
	static forRootAsync(options: TmsModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);
		return {
			module: TmsModule,
			imports: options.imports,
			providers: [TmsService, asyncOptions],
			exports: [TmsService],
		};
	}

	private static createAsyncOptionsProvider(options: TmsModuleAsyncOptions): Provider {
		return {
			provide: TMS_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject || [],
		};
	}
}

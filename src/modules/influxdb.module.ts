import { INFLUX_DB_MODULE_OPTIONS } from "@constants/providers";
import { InfluxDBModuleAsyncOptions } from "@interfaces/influxdb.interfaces";
import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { InfluxDBService } from "@services";


@Global()
@Module({})
export class InfluxDBModule {
	static forRootAsync(options: InfluxDBModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);
		return {
			module: InfluxDBModule,
			imports: options.imports,
			providers: [InfluxDBService, asyncOptions],
			exports: [InfluxDBService],
		};
	}

	private static createAsyncOptionsProvider(options: InfluxDBModuleAsyncOptions): Provider {
		return {
			provide: INFLUX_DB_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject ?? [],
		};
	}
}

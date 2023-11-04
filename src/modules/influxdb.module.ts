import { INFLUX_DB_MODULE_OPTIONS, INFLUX_DB_SERVICE_PROVIDER } from "@constants/provider.tokens";
import { InfluxDBOptions } from "@interfaces/options/influxdb.options";
import { IModuleAsyncOptions } from "@interfaces/options/module.options";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { InfluxDBService } from "@services";
import { createDynamicModule } from "@utils";

@Global()
@Module({})
export class InfluxDBModule {
	static forRootAsync(options: IModuleAsyncOptions<InfluxDBOptions>): DynamicModule {
		return createDynamicModule(
			InfluxDBModule,
			InfluxDBService,
			INFLUX_DB_SERVICE_PROVIDER,
			options,
			INFLUX_DB_MODULE_OPTIONS
		)
	}
}

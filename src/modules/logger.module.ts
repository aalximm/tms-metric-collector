import { LOGGER_MODULE_OPTIONS, LOGGER_PROVIDER } from "@constants/provider.tokens";
import { LoggerOptions } from "@interfaces/options/logger.options";
import { IModuleAsyncOptions } from "@interfaces/options/module.options";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { Logger } from "@services";
import { createDynamicModule } from "@utils";

@Global()
@Module({})
export class LoggerModule {
	static forRootAsync(options: IModuleAsyncOptions<LoggerOptions>): DynamicModule {
		return createDynamicModule(
			LoggerModule,
			Logger,
			LOGGER_PROVIDER,
			options,
			LOGGER_MODULE_OPTIONS
		)
	}
}

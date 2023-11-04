import { WINSTON_MODULE_OPTIONS } from '@constants/providers';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { Logger } from '@services';
import { WinstonModule, WinstonModuleAsyncOptions } from 'nest-winston';

@Global()
@Module({})
export class LoggerModule extends WinstonModule{
	public static forRootAsync(options: WinstonModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);
		return {
			module: LoggerModule,
			imports: options.imports,
			providers: [Logger, asyncOptions],
			exports: [Logger]
		}
	}

	private static createAsyncOptionsProvider(options: WinstonModuleAsyncOptions): Provider {
		return {
			provide: WINSTON_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject ?? [],
		};
	}
}
import { BUCKET_EXECUTOR_MODULE_OPTIONS, BUCKET_EXECUTOR_SERVICE_PROVICER } from "@constants/provider.tokens";
import { BucketExecutorOptions } from "@interfaces/options/bucketexecutor.options";
import { IModuleAsyncOptions } from "@interfaces/options/module.options";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { createDynamicModule } from "@utils";
import { BucketExecutorService } from "src/services/bucketexecutor.service";

@Global()
@Module({})
export class BucketExecutorModule {
	static forRootAsync(options: IModuleAsyncOptions<BucketExecutorOptions>): DynamicModule {
		return createDynamicModule(
			BucketExecutorModule,
			BucketExecutorService,
			BUCKET_EXECUTOR_SERVICE_PROVICER,
			options,
			BUCKET_EXECUTOR_MODULE_OPTIONS
		)
	}
}

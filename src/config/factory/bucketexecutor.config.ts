import { BucketExecutorOptions } from "@interfaces/options/bucketexecutor.options";
import { IConfig } from "@interfaces/options/module.options";

export const getBucketExecutorConfig: IConfig<BucketExecutorOptions> = (configService) => {
	return {
		delay: configService.get<number>("bucket_executor.delay"),
		bucketSize: configService.get<number>("bucket_executor.bucket_size"),
	};
};

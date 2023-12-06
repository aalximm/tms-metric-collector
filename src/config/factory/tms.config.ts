import { TmsOptions } from "@interfaces/options/tms.options";
import { IConfig } from "@interfaces/options/module.options";

export const getTmsConfig: IConfig<TmsOptions> = (configService) => {
	return {
		token: configService.get<string>("TMS_TOKEN"),
		baseUrl: configService.get<string>("tms.base_url"),
		bucketSize: configService.get<number>("tms.bucket_size"),
	};
};

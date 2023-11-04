import { TmsOptions } from "@interfaces/options/tms.options";
import { IConfig } from "@interfaces/options/module.options";

export const getTmsConfig: IConfig<TmsOptions> = (configService) => {
	return {
		token: configService.get<string>("TMS_TOKEN"),
	};
};

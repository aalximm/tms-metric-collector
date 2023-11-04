import { ConfigService } from "@nestjs/config";
import { TmsOptions } from "@interfaces/tms.interfaces";

export const getTmsConfig = (configService: ConfigService): TmsOptions => {
	return {
		token: configService.get<string>("TMS_TOKEN"),
	};
};

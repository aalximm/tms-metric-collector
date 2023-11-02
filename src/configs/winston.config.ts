import { ConfigService } from "@nestjs/config";
import { WinstonModuleOptions, utilities as nestWinstonModuleUtilities } from "nest-winston";
import * as winston from "winston";

export const getWinstonConfig = (configService: ConfigService): WinstonModuleOptions => {
	return {
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.timestamp(),
					winston.format.ms(),
					nestWinstonModuleUtilities.format.nestLike("MyApp", {
						colors: true,
						prettyPrint: true,
					}),
				),
			}),
		],
		level: "info",
	};
};

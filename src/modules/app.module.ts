import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getInfluxDBConfig, getTmsConfig, getLoggerConfig } from "@config-factory";
import { InfluxDBModule } from "./influxdb.module";
import { LoggerModule } from "./logger.module";
import { TmsModule } from "./tms.module";
import { TestRunsAgregatorModule } from "./test-runs-agregator.module";
import * as Joi from "joi";
import configuration from "@config/app.config";
import { getTestRunsAgregatorConfig } from "@config/factory/test-runs-agregator.config";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [".local.env"],
			load: [configuration],
			validationSchema: Joi.object({
				INFLUXDB_TOKEN: Joi.string().required(),
				INFLUXDB_URL: Joi.string().uri().required(),
				INFLUXDB_ORG: Joi.string().required(),
				INFLUXDB_BUCKET: Joi.string().required(),
				TMS_TOKEN: Joi.string().required(),
			}),
			isGlobal: true,
		}),
		LoggerModule.forRootAsync({
			useFactory: getLoggerConfig,
			imports: [ConfigModule],
			inject: [ConfigService],
		}),
		InfluxDBModule.forRootAsync({
			useFactory: getInfluxDBConfig,
			imports: [ConfigModule],
			inject: [ConfigService],
		}),
		TmsModule.forRootAsync({
			useFactory: getTmsConfig,
			imports: [ConfigModule],
			inject: [ConfigService],
		}),
		TestRunsAgregatorModule.forRootAsync({
			useFactory: getTestRunsAgregatorConfig,
			imports: [ConfigModule],
			inject: [ConfigService]
		}),
	],
	controllers: [],
	providers: [],
})
export class AppModule {}

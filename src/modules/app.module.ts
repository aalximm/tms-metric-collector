import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getInfluxDBConfig, getTmsConfig, getLoggerConfig } from "@configs";
import { TestRunAgregatorController } from "@controllers";
import { InfluxDBModule } from "./influxdb.module";
import { LoggerModule } from "./logger.module";
import { TmsModule } from "./tms.module";
import { TestRunsAgregatorModule } from "./test-runs-agregator.module";
import { AppController } from "src/controllers/app.controller";


@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [".env", ".env.local"],
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
		TestRunsAgregatorModule,
	],
	controllers: [TestRunAgregatorController, AppController],
	providers: [],
})
export class AppModule {}

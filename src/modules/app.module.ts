import { Module } from "@nestjs/common";
import { InfluxDBModule } from "./influxdb.module";
import { TmsModule } from "./tms.module";
import { WinstonModule } from "nest-winston";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getWinstonConfig } from "../configs/winston.config";
import { getTmsConfig } from "../configs/tms.config";
import { getInfluxDBConfig } from "../configs/influxdb.config";
import { TestRunsAgregatorModule } from "./test-runs-agregator.module";
import { TestRunAgregatorController } from "../controllers/test-run-agregator.controller";

@Module({
	imports: [
		//TODO сделать конфиг в yaml формате
		ConfigModule.forRoot({
			envFilePath: [".env", ".env.local"],
			isGlobal: true,
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
		WinstonModule.forRootAsync({
			useFactory: getWinstonConfig,
			imports: [ConfigModule],
			inject: [ConfigService],
		}),
		TestRunsAgregatorModule,
	],
	controllers: [TestRunAgregatorController],
	providers: [],
})
export class AppModule {}

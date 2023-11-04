import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { InfluxDBModule, LoggerModule, TestRunsAgregatorModule, TmsModule } from "@modules";
import { getInfluxDBConfig, getTmsConfig, getWinstonConfig } from "@configs";
import { TestRunAgregatorController } from "@controllers";


@Module({
	imports: [
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
		LoggerModule.forRootAsync({
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

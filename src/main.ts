import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "@modules";
import { InfluxDBService, TestRunsAgregatorService } from "@services";
import { INFLUX_DB_SERVICE_PROVIDER, TEST_RUNS_AGREGATOR_SERVICE_PROVIDER } from "@constants/provider.tokens";

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(AppModule, {
		bufferLogs: true,
	});
	const influxdbService = app.get<InfluxDBService>(INFLUX_DB_SERVICE_PROVIDER);
	const testRunAgregatorService = app.get<TestRunsAgregatorService>(TEST_RUNS_AGREGATOR_SERVICE_PROVIDER);
	
	const configService: ConfigService = app.get(ConfigService);
	const projectCode = configService.get<string>("TEST_AGREGATOR_PROJECT_CODE")

	await influxdbService.tryToConnect(20);

	await testRunAgregatorService.updateDataBase(projectCode);

	app.close();
}
bootstrap();

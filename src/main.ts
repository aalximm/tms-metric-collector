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
	
	const configService = app.get<ConfigService>(ConfigService);
	const limit = configService.get<number>("AGREGATOR_LIMIT");
	const offset = configService.get<number>("AGREGATOR_INITIAL_OFFSET");

	await influxdbService.tryToConnect(20);
	const lastRun = await influxdbService.getLastTestRun("test run", 7);
	console.log("last run: " + JSON.stringify(lastRun));

	if (lastRun) await testRunAgregatorService.updateDataBase("UL", { offset: lastRun.runId, limit });
	else await testRunAgregatorService.updateDataBase("UL", { offset, limit });

	app.close();
}
bootstrap();

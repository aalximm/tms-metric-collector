import { NestFactory } from "@nestjs/core";
import { AppModule } from "@modules";
import { InfluxDBService, TestRunsAgregatorService } from "@services";
import { INFLUX_DB_SERVICE_PROVIDER } from "@constants/provider.tokens";

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(AppModule, {
		bufferLogs: true,
	});
	const influxdbService = app.get<InfluxDBService>(INFLUX_DB_SERVICE_PROVIDER);
	const testRunAgregatorService = app.get<TestRunsAgregatorService>(TestRunsAgregatorService);

	await influxdbService.tryToConnect(20);
	// await influxdbService.setUp();
	const lastRun = await influxdbService.getLastTestRun("test run", 7);
	console.log("last run: " + JSON.stringify(lastRun));

	if (lastRun) await testRunAgregatorService.updateDataBase("UL", { offset: lastRun.runId, limit: 200 });
	else await testRunAgregatorService.updateDataBase("UL", { offset: 350, limit: 200 });

	app.close();
}
bootstrap();

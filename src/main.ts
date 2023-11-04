import { NestFactory } from "@nestjs/core";
import { AppModule } from "@modules";
import { TmsService } from "@services";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true
	});
	await app.listen(3001);
	// const configService: ConfigService = app.get(ConfigService);
	// const testRunAgregatorService: TestRunsAgregatorService = app.get(TestRunsAgregatorService);
	// await testRunAgregatorService.updateDataBase(
	// 	configService.get("AGREGATOR_PROJECT_CODE"),
	// 	{
	// 		offset: configService.get<number>("AGREGATOR_OFFSET") ?? 350,
	// 		limit: configService.get<number>("AGREGATOR_LIMIT") ?? 200
	// 	}
	// );
	// app.close();
}
bootstrap();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "@modules";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { TestRunsAgregatorService } from "@services";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(AppModule);
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
	const configService: ConfigService = app.get(ConfigService);
	const testRunAgregatorService: TestRunsAgregatorService = app.get(TestRunsAgregatorService);
	await testRunAgregatorService.updateDataBase(
		configService.get("AGREGATOR_PROJECT_CODE"),
		{
			offset: configService.get<number>("AGREGATOR_OFFSET") ?? 350,
			limit: configService.get<number>("AGREGATOR_LIMIT") ?? 200
		}
	);
	app.close();
}
bootstrap();

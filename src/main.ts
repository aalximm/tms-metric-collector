import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
	await app.listen(3001);
}
bootstrap();

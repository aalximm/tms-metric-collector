import { Module } from "@nestjs/common";
import { TestRunsAgregatorService } from "@services";

@Module({
	providers: [TestRunsAgregatorService],
	exports: [TestRunsAgregatorService],
	imports: [],
})
export class TestRunsAgregatorModule {}

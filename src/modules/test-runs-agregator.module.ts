import { Module } from "@nestjs/common";
import { TestRunsAgregatorService } from "../services/test-runs-agregator.service";

@Module({
	providers: [TestRunsAgregatorService],
	exports: [TestRunsAgregatorService],
	imports: [],
})
export class TestRunsAgregatorModule {}

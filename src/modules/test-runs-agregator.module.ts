import { TEST_RUNS_AGREGATOR_MODULE_OPTIONS, TEST_RUNS_AGREGATOR_SERVICE_PROVIDER } from "@constants/provider.tokens";
import { IModuleAsyncOptions } from "@interfaces/options/module.options";
import { TestRunsAgregatorOptions } from "@interfaces/options/test-runs-agregator.options";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { TestRunsAgregatorService } from "@services";
import { createDynamicModule } from "@utils";

@Global()
@Module({})
export class TestRunsAgregatorModule {
	static forRootAsync(options: IModuleAsyncOptions<TestRunsAgregatorOptions>): DynamicModule {
		return createDynamicModule(
			TestRunsAgregatorModule,
			TestRunsAgregatorService,
			TEST_RUNS_AGREGATOR_SERVICE_PROVIDER,
			options,
			TEST_RUNS_AGREGATOR_MODULE_OPTIONS);
	}
}

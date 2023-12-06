import { IConfig } from "@interfaces/options/module.options";
import { TestRunsAgregatorOptions } from "@interfaces/options/test-runs-agregator.options";

export const getTestRunsAgregatorConfig: IConfig<TestRunsAgregatorOptions> = configService => {
	return {
		trackEmptyCases: configService.get<boolean>("agregator.track_duration_of_empty_cases"),
		recursiveCountingOfSteps: configService.get<boolean>("agregator.recursive_counting_of_steps"),
		initialOffset: configService.get<number>("agregator.initial_offset")
	};
};

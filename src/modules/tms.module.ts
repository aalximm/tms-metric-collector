import { DynamicModule, Global, Module } from "@nestjs/common";
import { TmsService } from "@services";
import { TMS_SERVICE_PROVIDER, TMS_MODULE_OPTIONS } from "@constants/provider.tokens";
import { createDynamicModule } from "@utils";
import { IModuleAsyncOptions } from "@interfaces/options/module.options";
import { TmsOptions } from "@interfaces/options/tms.options";

@Global()
@Module({})
export class TmsModule {
	static forRootAsync(options: IModuleAsyncOptions<TmsOptions>): DynamicModule {
		return createDynamicModule(TmsModule, TmsService, TMS_SERVICE_PROVIDER, options, TMS_MODULE_OPTIONS);
	}
}

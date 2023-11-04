import { DynamicModule, Provider } from "@nestjs/common";

export const createDynamicModule = (module: any, service: any, serviceToken: string, options: any, optionsToken: string): DynamicModule => {

	return {
		module: module,
		imports: options.imports,
		providers: [
			createAsyncOptionsProvider(options, optionsToken),
			createServiceProvider(service, serviceToken)],
		exports: [
			createServiceProvider(service, serviceToken)
		],
	}
}

const createAsyncOptionsProvider = (options: any, token: string): Provider => {
	return {
		provide: token,
		useFactory: async (...args: any[]) => {
			const config = await options.useFactory(...args);
			return config;
		},
		inject: options.inject ?? [],
	};
}

const createServiceProvider = (service: any, serviceToken: string): Provider => {
	return {
		provide: serviceToken,
		useClass: service
	}
}
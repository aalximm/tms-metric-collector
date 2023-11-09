import { LOGGER_MODULE_OPTIONS } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { LoggerOptions } from "@interfaces/options/logger.options";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { createLogger, Logger as WinstonLogger } from "winston";

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements ILogger {
	private logger: WinstonLogger;
	private context?: string;

	constructor(@Inject(LOGGER_MODULE_OPTIONS) options: LoggerOptions) {
		this.logger = createLogger(options);
	}

	setContext(context: string) {
		this.context = context;
	}

	initService(serviceName: string, options?: any) {
		this.setContext(serviceName);
		if (options) this.info(`Init service ${serviceName} with params:\n${JSON.stringify(options)}`);
		else this.info(`Init service ${serviceName} without params`);
	}

	public info(message: any, context?: string): any {
		context = context || this.context;

		if (!!message && "object" === typeof message) {
			const { message: msg, level = "info", ...meta } = message;

			return this.logger.log(level, msg as string, { context, ...meta });
		}

		return this.logger.info(message, { context });
	}

	public error(message: any, trace?: string, context?: string): any {
		context = context || this.context;

		if (message instanceof Error) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { message: msg, name, stack, ...meta } = message;

			return this.logger.error(msg, { context, stack: [trace || message.stack], error: message, ...meta });
		}

		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message;

			return this.logger.error(msg as string, { context, stack: [trace], ...meta });
		}

		return this.logger.error(message, { context, stack: [trace] });
	}

	public warn(message: any, context?: string): any {
		context = context || this.context;

		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message;

			return this.logger.warn(msg as string, { context, ...meta });
		}

		return this.logger.warn(message, { context });
	}

	public debug?(message: any, context?: string): any {
		context = context || this.context;

		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message;

			return this.logger.debug(msg as string, { context, ...meta });
		}

		return this.logger.debug(message, { context });
	}

	public verbose?(message: any, context?: string): any {
		context = context || this.context;

		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message;

			return this.logger.verbose(msg as string, { context, ...meta });
		}

		return this.logger.verbose(message, { context });
	}
}

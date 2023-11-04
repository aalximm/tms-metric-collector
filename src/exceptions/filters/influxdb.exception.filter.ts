import { LOGGER_PROVIDER } from "@constants/provider.tokens";
import { ILogger } from "@interfaces/logger.interface";
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Inject } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(private readonly httpAdapterHost: HttpAdapterHost, @Inject(LOGGER_PROVIDER) private logger: ILogger ) {}

	catch(exception: Error, host: ArgumentsHost) {
		// In certain situations `httpAdapter` might not be available in the
		// constructor method, thus we should resolve it here.
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();

		const httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

		const responseBody = {
			statusCode: httpStatus,
			timestamp: new Date().toISOString(),
			path: httpAdapter.getRequestUrl(ctx.getRequest()),
		};

		this.logger.error(exception);

		httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
	}
}

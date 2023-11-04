import { LOGGER_PROVIDER } from '@constants/provider.tokens';
import { ILogger } from '@interfaces/logger.interface';
import { Controller, Get, Inject } from '@nestjs/common';

@Controller()
export class AppController {
	constructor(@Inject(LOGGER_PROVIDER) private logger: ILogger) { 
		this.logger.setContext("App Controller")
	}
	
	@Get()
	async initDatabase() {
		this.logger.info('Hello');
		this.logger.warn('Hello');
		this.logger.error('Hello');
		this.logger.verbose('Hello');
	}
}

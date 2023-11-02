import { Controller, Get, Query } from '@nestjs/common';
import { TestRunsAgregatorService } from 'src/services/test-runs-agregator.service';

@Controller('test-run-agregator')
export class TestRunAgregatorController {
	constructor(private testRunAgregatorService: TestRunsAgregatorService) { }
	
	@Get()
	async initDatabase(
		@Query('projectCode') code: string,
		@Query('offset') offset: string,
		@Query('limit') limit: string
	) {
		return await this.testRunAgregatorService.updateDataBase(code,
			{
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset)
			});
	}
}

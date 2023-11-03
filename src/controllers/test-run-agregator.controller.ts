import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { TestRunsAgregatorService } from 'src/services/test-runs-agregator.service';

@Controller('test-run-agregator')
export class TestRunAgregatorController {
	constructor(private testRunAgregatorService: TestRunsAgregatorService) { }
	
	@Get()
	async initDatabase(
		@Query('projectCode') code: string,
		@Query('offset', ParseIntPipe) offset: number,
		@Query('limit', ParseIntPipe) limit: number
	) {
		return await this.testRunAgregatorService.updateDataBase(code,
			{
				limit,
				offset
			});
	}
}

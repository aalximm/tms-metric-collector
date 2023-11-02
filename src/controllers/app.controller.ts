import { Controller, Get } from "@nestjs/common";
import { InfluxDBService } from "../services/influxdb.service";
import { TmsService } from "../services/tms.service";

@Controller()
export class AppController {
	constructor(private readonly influxDBService: InfluxDBService, private readonly tmsService: TmsService) {}

	@Get()
	async getHello() {
		return this.influxDBService.addSimplePoint();
	}
}

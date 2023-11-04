import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class InfluxDBError extends HttpException {
	constructor(err?: Error, message?: string) {
		super(message || 'Ошибка при обращении к influxDB', HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: err
		});
	}
  }
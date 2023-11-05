import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class InfluxDBError extends HttpException {
	constructor(message: string, err?: Error) {
		super(message, HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: err
		});
	}
  }
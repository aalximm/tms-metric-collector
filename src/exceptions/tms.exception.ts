import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class TmsException extends HttpException {
	constructor(err?: Error) {
		super('Ошибка при получении данных от ТМС', HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: err
		});
	}
  }
import { Point } from "@influxdata/influxdb-client";

export class SafePoint extends Point {
	constructor(measurmentName?: string) {
		super(measurmentName);
	}

	public safeStringField(name?: string, value?: string) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (name && value) this.stringField(name!, value!);
		return this;
	}

	public stringField(name: string, value: any): SafePoint {
		super.stringField(name, value);
		return this;
	}

	public intField(name: string, value: any): SafePoint {
		super.intField(name, value);
		return this;
	}

	public booleanField(name: string, value: any): SafePoint {
		super.booleanField(name, value);
		return this;
	}

	public timestamp(value: string | number | Date): SafePoint {
		super.timestamp(value);
		return this;
	}
}
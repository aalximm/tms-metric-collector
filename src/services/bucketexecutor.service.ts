import { BUCKET_EXECUTOR_MODULE_OPTIONS, LOGGER_PROVIDER } from "@constants/provider.tokens";
import { Iterable } from "@interfaces/iterable.interface";
import { ILogger } from "@interfaces/logger.interface";
import { BucketExecutorOptions } from "@interfaces/options/bucketexecutor.options";
import { Inject, Injectable } from "@nestjs/common";
import { ProgressBar } from "@services";

@Injectable()
export class BucketExecutorService {
	private delay: number;
	private bucketSize: number;

	constructor(@Inject(BUCKET_EXECUTOR_MODULE_OPTIONS) options: BucketExecutorOptions, @Inject(LOGGER_PROVIDER) private logger: ILogger) {
		this.delay = options.delay;
		this.bucketSize = options.bucketSize;
		this.logger.setContext("BucketExecutor");
	}

	public async executeAll<T>(tasks: Promise<T[]>[], proccessName?: string): Promise<T[]> {
		const results: T[] = [];

		const taskBuckets = this.getPromiseBuckets(tasks, this.bucketSize);
		const progressBar = new ProgressBar(this.logger);

		progressBar.start(taskBuckets.length, proccessName)

		for (let i = 0; i < taskBuckets.length; i++) {
			progressBar.set(i, "tasks completed");
			const res = await taskBuckets[i];
			await new Promise(resolve => setTimeout(resolve, this.delay));
			results.push(...res);
		}

		progressBar.end();

		return results;
	}

	public async executeAllFromGenerator<T>(tasksGenerator: Iterable<Promise<T[]>>, proccessName?: string): Promise<T[]> {
		const results: T[] = [];

		let tasksBucket: Promise<T[]>[] = [new Promise(resolve => resolve([]))];

		while (await tasksGenerator.hasNext()) {

			tasksBucket.push(... await tasksGenerator.next());

			if (tasksBucket.length >= this.bucketSize) {
				results.concat(... await this.executeBucket(tasksBucket));
				await this.sleep(this.delay);
				tasksBucket = [new Promise(resolve => resolve([]))];
			}
		}

		return results;
	}

	private getPromiseBuckets<T>(tasks: Promise<T[]>[], bucketSize?: number): Promise<T[]>[] {
		if (bucketSize === undefined) {
			return [Promise.all(tasks).then(results => [].concat(...results))];
		}

		const newTasks = [new Promise<T[]>(resolve => resolve([]))];

		for (let i = 0; i < tasks.length; i += bucketSize) {
			newTasks.push(...this.getPromiseBuckets(tasks.slice(i, Math.min(i + bucketSize, tasks.length))));
		}

		return newTasks;
	}

	private async executeBucket<T>(tasks: Promise<T[]>[]): Promise<T[]> {
		return Promise.all(tasks).then(results => [].concat(...results));
	}

	private async sleep(ms: number) {
		return Promise.resolve(resolve => setTimeout(resolve, ms));
	}
}

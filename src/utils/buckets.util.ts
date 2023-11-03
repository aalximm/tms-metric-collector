export function getBuckets(array: number[], maximumBucketSize: number): { startOfBucket: number, bucketSize: number }[] {
	array.sort((a,b) => a - b);
	const result: { startOfBucket: number, bucketSize: number }[] = [];
	for (let i=0, j = 0; j < array.length; j++){
		if (array[i] + maximumBucketSize < array[j]) {
			result.push({ startOfBucket: array[i], bucketSize: array[j - 1] - array[i] })
			i = j;
		}
	}

	if(result.length == 0) return [{startOfBucket: array[0], bucketSize: array[array.length]}]
	return result;
}

export function executeWithBuckets<T, R>(inputArray: T[], consumer: (bucket: T[]) => R, bucketSize: number): R[] {
	const results: R[] = [];
	for (let i = 0; i < inputArray.length; i += bucketSize) {
		results.push(consumer(inputArray.slice(i, i + 500 >= inputArray.length ? inputArray.length : i + 500)));
	}

	return results;
}

// export async function executeWithBucketsSync<T, R>(inputArray: T[], consumer: (bucket: T[]) => Promise<R>, bucketSize: number): Promise<R[]> {
// 	const tasks: Promise<R>[] = [];
// 	for (let i = 0; i < inputArray.length; i += bucketSize) {
// 		tasks.push(consumer(inputArray.slice(i, i + 500 >= inputArray.length ? inputArray.length : i + 500)));
// 	}

// 	return await Promise.resolve(tasks).then((value) => await value);
// }
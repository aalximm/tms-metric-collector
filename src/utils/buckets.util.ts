export function getBuckets(array: number[], maximumBucketSize: number): { startOfBucket: number, bucketSize: number }[] {
	array.sort((a, b) => a - b);
	const result: { startOfBucket: number, bucketSize: number }[] = [];
	for (let i = 0, j = 0; j < array.length; j++){
		if (array[i] + maximumBucketSize < array[j]) {
			result.push({ startOfBucket: array[i] - 1, bucketSize: array[j - 1] - array[i] })
			i = j;
		}
	}

	if (result.length == 0) return [{ startOfBucket: array[0], bucketSize: array[array.length] }]
	
	return result;
}
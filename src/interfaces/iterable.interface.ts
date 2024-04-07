export interface Iterable<T> {
	hasNext(): Promise<boolean> | boolean;
	next(): Promise<T[]> | T[];
}
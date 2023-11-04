export interface ILogger {
	setContext(context: string): void;
	info(message: any, context?: string): any;
	error(message: any, trace?: string, context?: string): any;
	warn(message: any, context?: string): any;
	debug?(message: any, context?: string): any;
	verbose?(message: any, context?: string): any;
}

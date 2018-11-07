import 'Main';

type LogOptions = {appendStackTrace?: boolean, logLater?: boolean};
declare global {
	function Log(options: LogOptions, ...messageSegments: any[]);
	function Log(...messageSegments: any[]);
}
window['Log'] = (...args) => {
	let options: LogOptions = {};
	let messageSegments: any[];
	if (typeof args[0] === 'object') [options, ...messageSegments] = args;
	else messageSegments = args;
	// #mms: add-stack-trace-and-current-call-info-to-logs setting exists

	if (options.appendStackTrace) {
		/* if (inUnity)
			finalMessage += "\n\nStackTrace) " + new Error().stack;
		else */
		messageSegments.push(`\n@${GetStackTraceStr()}`);
	}

	console.log(...messageSegments);

	return messageSegments.length === 1 ? messageSegments[0] : messageSegments;
}

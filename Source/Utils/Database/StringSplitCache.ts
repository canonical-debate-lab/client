const splitCache_forwardSlash = {};

// export function SplitString_Cached(str: string, splitChar: string) {
export function splitStringBySlash_cached(str: string): string[] {
	if (splitCache_forwardSlash[str] == null) {
		splitCache_forwardSlash[str] = str.split('/');
	}
	return splitCache_forwardSlash[str];
}

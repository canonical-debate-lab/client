import { VURL, GetCurrentURLString } from 'js-vextensions';
import { State } from 'Frame/Store/StoreHelpers';

export const rootPages = [
	'stream', 'chat', 'reputation',
	'database', 'feedback', 'forum', 'more',
	'home',
	'social', 'personal', 'debates', 'global',
	'search', 'guide', 'profile',
];
// a default-child is only used (ie. removed from url) if there are no path-nodes after it
export const rootPageDefaultChilds = {
	database: 'users',
	feedback: 'proposals',
	more: 'links',
	home: 'home',
	global: 'map',
};

export function GetCurrentURL(fromAddressBar = false) {
	return fromAddressBar ? VURL.Parse(GetCurrentURLString()) : VURL.FromLocationObject(State('router'));
}
export function NormalizeURL(url: VURL) {
	const result = url.Clone();
	if (!rootPages.Contains(result.pathNodes[0])) {
		result.pathNodes.Insert(0, 'home');
	}
	if (result.pathNodes[1] == null && rootPageDefaultChilds[result.pathNodes[0]]) {
		result.pathNodes.Insert(1, rootPageDefaultChilds[result.pathNodes[0]]);
	}
	return result;
}

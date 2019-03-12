import { CachedTransform } from 'js-vextensions';
import {GetData} from 'Utils/FrameworkOverrides';
import { MapNodePhrasing } from './nodePhrasings/@MapNodePhrasing';

/* export function GetPhrasings(nodeID: string): MapNodePhrasing[] {
	const entryMap = GetData({ collection: true }, 'nodePhrasings', nodeID, 'phrasings');
	return CachedTransform('GetPhrasings', [], entryMap, () => (entryMap ? entryMap.VValues(true) : []));
} */
// todo: make this use an actual query, to improve performance
export function GetNodePhrasings(nodeID: string): MapNodePhrasing[] {
	const entryMap = GetData({ collection: true }, 'nodePhrasings');
	return CachedTransform('GetNodePhrasings', [nodeID], entryMap, () => (entryMap ? entryMap.VValues(true).filter(a => a && a.node == nodeID) : []));
}

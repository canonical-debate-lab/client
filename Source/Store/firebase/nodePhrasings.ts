import { GetData } from 'vwebapp-framework/Source';
import { CachedTransform } from 'js-vextensions';
import { MapNodePhrasing } from './nodePhrasings/@MapNodePhrasing';

/* export function GetPhrasings(nodeID: number): MapNodePhrasing[] {
	const entryMap = GetData({ collection: true }, 'nodePhrasings', nodeID, 'phrasings');
	return CachedTransform('GetPhrasings', [], entryMap, () => (entryMap ? entryMap.VValues(true) : []));
} */
// todo: make this use an actual query, to improve performance
export function GetNodePhrasings(nodeID: number): MapNodePhrasing[] {
	const entryMap = GetData({ collection: true }, 'nodePhrasings');
	return CachedTransform('GetNodePhrasings', [nodeID], entryMap, () => (entryMap ? entryMap.VValues(true).filter(a => a && a.node == nodeID) : []));
}

import { CachedTransform, IsNaN } from 'js-vextensions';
import { GetData } from 'Utils/FrameworkOverrides';
import { MapNodeRevision } from './nodes/@MapNodeRevision';

export function GetNodeRevision(id: number) {
	if (id == null || IsNaN(id)) return null;
	return GetData('nodeRevisions', id) as MapNodeRevision;
}
// todo: make this use an actual query, to improve performance
// todo2 (nvm, canceled): actually, maybe instead just use approach used for map-node-phrasings (having separate db-path for each node's phrasing-collection) -- assuming it has no unforeseen issues
export function GetNodeRevisions(nodeID: number): MapNodeRevision[] {
	const entryMap = GetData({ collection: true }, 'nodeRevisions');
	return CachedTransform('GetNodeRevisions', [nodeID], entryMap, () => (entryMap ? entryMap.VValues(true).filter(a => a && a.node == nodeID) : []));
}

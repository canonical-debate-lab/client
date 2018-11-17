import { Assert } from 'js-vextensions';
import { ViewedNodeSet } from 'Store/firebase/userViewedNodes/@ViewedNodeSet';
import { GetUserViewedNodes } from 'Store/firebase/userViewedNodes';
import { GetNodeViewerSet } from 'Store/firebase/nodeViewers';
import { GetDataAsync, GetAsync } from '../../Frame/Database/DatabaseHelpers';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { Command } from '../Command';

export class NotifyNodeViewed extends Command<{nodeID: number}, {}> {
	nodeViewers_old: ViewedNodeSet;
	userViewedNodes_old: ViewedNodeSet;
	async Prepare() {
		const { nodeID } = this.payload;
		this.nodeViewers_old = await GetAsync(() => GetNodeViewerSet(nodeID) || {});
		this.userViewedNodes_old = await GetAsync(() => GetUserViewedNodes(this.userInfo.id) || {});
	}
	async Validate() {
		const { nodeID } = this.payload;
		const nodeData = await GetDataAsync('nodes', nodeID) as MapNode;
		Assert(nodeData, 'Node must exist for you to view it!');
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;

		const updates = {};
		updates[`nodeViewers/${nodeID}`] = this.nodeViewers_old.Extended({ [this.userInfo.id]: true });
		updates[`userViewedNodes/${this.userInfo.id}`] = this.userViewedNodes_old.Extended({ [nodeID]: true });
		return updates;
	}
}

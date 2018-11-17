import { Assert } from 'js-vextensions';
import { ViewedNodeSet } from 'Store/firebase/userViewedNodes/@ViewedNodeSet';
import { GetUserViewedNodes } from 'Store/firebase/userViewedNodes';
import { GetNodeViewerSet } from 'Store/firebase/nodeViewers';
import { GetDataAsync, GetAsync } from '../../Frame/Database/DatabaseHelpers';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { Command } from '../Command';
import { GetNode } from 'Store/firebase/nodes';

export class NotifyNodeViewed extends Command<{nodeID: number}, {}> {
	async Prepare() {}
	async Validate() {
		const { nodeID } = this.payload;
		// const nodeData = await GetDataAsync('nodes', nodeID) as MapNode;
		const nodeData = await GetAsync(()=>GetNode(nodeID))
		Assert(nodeData, `Node #${nodeID} must exist for you to view it!`);
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;

		const updates = {};
		updates[`nodeViewers/${nodeID}/.${this.userInfo.id}`] = true;
		updates[`userViewedNodes/${this.userInfo.id}/.${nodeID}`] = true;
		return updates;
	}
}

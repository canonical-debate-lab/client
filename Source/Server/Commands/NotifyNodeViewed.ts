/* import { Assert } from 'js-vextensions';
import { GetNode } from 'Store/firebase/nodes';
import {GetAsync} from 'Utils/FrameworkOverrides';
import {Command} from 'Utils/FrameworkOverrides';

export class NotifyNodeViewed extends Command<{nodeID: string}, {}> {
	async Prepare() {}
	async Validate() {
		const { nodeID } = this.payload;
		// const nodeData = await GetDataAsync('nodes', nodeID) as MapNode;
		const nodeData = await GetAsync(() => GetNode(nodeID));
		Assert(nodeData, `Node #${nodeID} must exist for you to view it!`);
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;

		const updates = {};
		updates[`nodeViewers/${nodeID}/.${this.userInfo.id}`] = true;
		updates[`userViewedNodes/${this.userInfo.id}/.${nodeID}`] = true;
		return updates;
	}
} */

import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate } from 'Utils/FrameworkOverrides';
import {Command} from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';
import {GetNode} from 'Store/firebase/nodes';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';

AddSchema('UpdateNodeChildrenOrder_payload', {
	properties: {
		mapID: { type: 'string' },
		nodeID: { type: 'string' },
		childrenOrder: { items: { type: 'string' } },
	},
	required: ['nodeID', 'childrenOrder'],
});

@MapEdit
@UserEdit
export class UpdateNodeChildrenOrder extends Command<{mapID?: string, nodeID: string, childrenOrder: string[]}, {}> {
	Validate_Early() {
		AssertValidate('UpdateNodeChildrenOrder_payload', this.payload, 'Payload invalid');
	}

	oldNodeData: MapNode;
	newNodeData: MapNode;
	async Prepare() {
		const { mapID, nodeID, childrenOrder } = this.payload;
		this.oldNodeData = await GetAsync(() => GetNode(nodeID));
		this.newNodeData = { ...this.oldNodeData, ...{ childrenOrder } };
	}
	async Validate() {
		AssertValidate('MapNode', this.newNodeData, 'New node-data invalid');
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;
		const updates = {};
		updates[`nodes/${nodeID}`] = this.newNodeData;
		return updates;
	}
}

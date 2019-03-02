import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { Command } from '../Command';

AddSchema({
	properties: {
		mapID: { type: 'number' },
		nodeID: { type: 'number' },
		childrenOrder: { items: { type: 'number' } },
	},
	required: ['nodeID', 'childrenOrder'],
}, 'UpdateNodeChildrenOrder_payload');

@MapEdit
@UserEdit
export class UpdateNodeChildrenOrder extends Command<{mapID?: number, nodeID: number, childrenOrder: number[]}, {}> {
	Validate_Early() {
		AssertValidate('UpdateNodeChildrenOrder_payload', this.payload, 'Payload invalid');
	}

	oldNodeData: MapNode;
	newNodeData: MapNode;
	async Prepare() {
		const { mapID, nodeID, childrenOrder } = this.payload;
		this.oldNodeData = await GetDataAsync({ addHelpers: false }, 'nodes', nodeID) as MapNode;
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

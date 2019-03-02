import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { Command } from '../Command';

AddSchema({
	properties: {
		mapID: { type: 'number' },
		nodeID: { type: 'number' },
		multiPremiseArgument: { type: 'boolean' },
	},
	required: ['nodeID', 'multiPremiseArgument'],
}, 'SetNodeIsMultiPremiseArgument_payload');

@MapEdit
@UserEdit
export class SetNodeIsMultiPremiseArgument extends Command<{mapID?: number, nodeID: number, multiPremiseArgument: boolean}, {}> {
	Validate_Early() {
		AssertValidate('SetNodeIsMultiPremiseArgument_payload', this.payload, 'Payload invalid');
	}

	oldNodeData: MapNode;
	newNodeData: MapNode;
	async Prepare() {
		const { mapID, nodeID, multiPremiseArgument } = this.payload;
		this.oldNodeData = await GetDataAsync({ addHelpers: false }, 'nodes', nodeID) as MapNode;
		this.newNodeData = { ...this.oldNodeData, ...{ multiPremiseArgument } };
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

import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate, Command, GetDataAsync } from 'Utils/FrameworkOverrides';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';

AddSchema('SetNodeIsMultiPremiseArgument_payload', {
	properties: {
		mapID: { type: 'string' },
		nodeID: { type: 'string' },
		multiPremiseArgument: { type: 'boolean' },
	},
	required: ['nodeID', 'multiPremiseArgument'],
});

@MapEdit
@UserEdit
export class SetNodeIsMultiPremiseArgument extends Command<{mapID?: number, nodeID: string, multiPremiseArgument: boolean}, {}> {
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

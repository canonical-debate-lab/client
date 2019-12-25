import { Command, GetAsync } from 'mobx-firelink';
import { GetNode } from 'Store/firebase/nodes';
import { AddSchema, AssertValidate } from 'vwebapp-framework';
import { E, OMIT, DEL } from 'js-vextensions';
import { MapNodeL2, MapNode } from '../../Store/firebase/nodes/@MapNode';
import { UserEdit } from '../CommandMacros';

AddSchema('ChangeNodeOwnerMap_payload', {
	properties: {
		nodeID: { type: 'string' },
		newOwnerMapID: { type: ['null', 'string'] },
	},
	required: ['nodeID', 'newOwnerMapID'],
});

// todo: integrate rest of validation code, preferably using system callable from both here and the ui (this is needed for many other commands as well)

// @MapEdit
@UserEdit
export class ChangeNodeOwnerMap extends Command<{nodeID: string, newOwnerMapID: string}, {}> {
	Validate_Early() {
		AssertValidate('ChangeNodeOwnerMap_payload', this.payload, 'Payload invalid');
	}

	newData: MapNode;
	async Prepare() {
		const { nodeID, newOwnerMapID } = this.payload;
		const oldData = await GetAsync(() => GetNode(nodeID));
		this.newData = E(oldData, { ownerMapID: newOwnerMapID ?? DEL });
	}
	async Validate() {
		AssertValidate('MapNode', this.newData, 'New node-data invalid');
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;
		return {
			[`nodes/${nodeID}`]: this.newData,
		};
	}
}

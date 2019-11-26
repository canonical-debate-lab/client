import { Assert } from 'js-vextensions';
import { MapEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate } from 'Utils/FrameworkOverrides';
import {Command} from 'mobx-firelink';
import { UserEdit } from '../CommandMacros';

AddSchema('SetMapLayerStateForUser_payload', {
	properties: {
		userID: { type: 'string' },
		mapID: { type: 'string' },
		layerID: { type: 'string' },
		state: { type: ['null', 'boolean'] },
	},
	required: ['userID', 'mapID', 'layerID', 'state'],
});

@MapEdit
@UserEdit
export class SetMapLayerStateForUser extends Command<{userID: string, mapID: string, layerID: string, state: boolean}, {}> {
	Validate_Early() {
		AssertValidate('SetMapLayerStateForUser_payload', this.payload, 'Payload invalid');
	}

	async Prepare() {}
	async Validate() {
		const { userID } = this.payload;
		Assert(userID == this.userInfo.id, 'Cannot change this setting for another user!');
	}

	GetDBUpdates() {
		const { userID, mapID, layerID, state } = this.payload;
		const updates = {};
		updates[`userMapInfo/${userID}/.${mapID}/.layerStates/.${layerID}`] = state;
		// updates[`layers/${layerID}/usersWhereStateSet/${userID}`] = state;
		return updates;
	}
}

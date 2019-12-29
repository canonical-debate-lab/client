import { Command_Old, GetAsync, Command, AssertV, MergeDBUpdates } from 'mobx-firelink';
import { GetNode, GetNodesByIDs, GetNodeChildren } from 'Store/firebase/nodes';
import { AddSchema, AssertValidate, IsSpecialEmptyArray } from 'vwebapp-framework';
import { E, OMIT, DEL } from 'js-vextensions';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { GetMap } from 'Store/firebase/maps';
import { MapType } from 'Store/firebase/maps/@Map';
import { IsPremiseOfSinglePremiseArgument, GetNodeL2 } from 'Store/firebase/nodes/$node';
import { PermissionInfoType } from 'Store/firebase/nodes/@MapNodeRevision';
import { GetNodeRevision } from 'Store/firebase/nodeRevisions';
import { UserEdit } from '../CommandMacros';
import { MapNodeL2, MapNode } from '../../Store/firebase/nodes/@MapNode';

AddSchema('ChangeNodeOwnerMap_payload', {
	properties: {
		nodeID: { type: 'string' },
		newOwnerMapID: { type: ['null', 'string'] },
		argumentNodeID: { type: 'string' },
	},
	required: ['nodeID', 'newOwnerMapID'],
});

// todo: integrate rest of validation code, preferably using system callable from both here and the ui (this is needed for many other commands as well)

// @MapEdit
@UserEdit
export class ChangeNodeOwnerMap extends Command<{nodeID: string, newOwnerMapID: string, argumentNodeID?: string}, {}> {
	newData: MapNode;

	sub_changeOwnerMapForArgument: ChangeNodeOwnerMap;

	Validate() {
		AssertValidate('ChangeNodeOwnerMap_payload', this.payload, 'Payload invalid');
		const { nodeID, newOwnerMapID, argumentNodeID } = this.payload;
		const oldData = GetNode(nodeID);
		AssertV(oldData, 'oldData is null');

		AssertV(IsUserCreatorOrMod(this.userInfo.id, oldData), "User is not the node's creator, or a moderator.");
		// if making private
		if (oldData.ownerMapID == null) {
			const newOwnerMap = GetMap(newOwnerMapID);
			AssertV(newOwnerMapID, 'newOwnerMap still loading.');
			AssertV(newOwnerMap.type == MapType.Private, 'Node must be in private map to be made private.');

			const permittedPublicParentIDs = argumentNodeID ? [argumentNodeID] : [];

			const parents = GetNodesByIDs(oldData.parents?.VKeys() ?? []);
			const parentsArePrivateInSameMap = !IsSpecialEmptyArray(parents) && newOwnerMapID && parents.All((a) => a.ownerMapID == newOwnerMapID || permittedPublicParentIDs.Contains(a._key));
			AssertV(parentsArePrivateInSameMap, "To make node private, all its parents must be private nodes within the same map. (to ensure we don't leave links in other maps, which would make the owner-map-id invalid)");
		} else {
			// if making public
			AssertV(oldData.rootNodeForMap == null, "Cannot make a map's root-node public.");
			// the owner map must allow public nodes (at some point, may remove this restriction, by having action cause node to be auto-replaced with in-map private-copy)
			// AssertV(oldData.parents?.VKeys().length > 0, "Cannot make an")

			const revision = GetNodeRevision(oldData.currentRevision);
			AssertV(revision, 'revision not yet loaded.');
			AssertV(revision.permission_contribute?.type == PermissionInfoType.Anyone, 'To make node public, the "Contribute" permission must be set to "Anyone".');

			const permittedPrivateChildrenIDs = this.parentCommand instanceof ChangeNodeOwnerMap ? [this.parentCommand.payload.nodeID] : [];

			const children = GetNodeChildren(oldData);
			AssertV(!IsSpecialEmptyArray(children), 'children still loading.');
			AssertV(children.All((a) => a.ownerMapID == null || permittedPrivateChildrenIDs.Contains(a._key)), 'To make node public, it must not have any private children.');
		}

		this.newData = E(oldData, { ownerMapID: newOwnerMapID ?? DEL });
		AssertValidate('MapNode', this.newData, 'New node-data invalid');

		if (argumentNodeID) {
			this.sub_changeOwnerMapForArgument = this.sub_changeOwnerMapForArgument ?? new ChangeNodeOwnerMap({ nodeID: argumentNodeID, newOwnerMapID }).MarkAsSubcommand(this);
			this.sub_changeOwnerMapForArgument.Validate();
		}
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;
		let result = {
			[`nodes/${nodeID}`]: this.newData,
		};
		if (this.sub_changeOwnerMapForArgument) {
			result = MergeDBUpdates(result, this.sub_changeOwnerMapForArgument.GetDBUpdates());
		}
		return result;
	}
}

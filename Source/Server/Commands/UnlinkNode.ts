import { Assert } from 'js-vextensions';
import { GetDataAsync, GetAsync , Command } from 'Utils/FrameworkOverrides';

import { ForUnlink_GetError } from '../../Store_Old/firebase/nodes';
import { GetNodeL2 } from '../../Store_Old/firebase/nodes/$node';
import { MapEdit, UserEdit } from '../CommandMacros';

// todo: add full-fledged checking to ensure that nodes are never orphaned by move commands (probably use parents recursion to find at least one map root)

@MapEdit
@UserEdit
export class UnlinkNode extends Command<{mapID: string, parentID: string, childID: string}, {}> {
	allowOrphaning = false; // could also be named "asPartOfCut", to be consistent with ForUnlink_GetError parameter

	parent_oldChildrenOrder: string[];
	async Prepare() {
		const { parentID, childID } = this.payload;
		this.parent_oldChildrenOrder = await GetDataAsync('nodes', parentID, '.childrenOrder') as string[];
	}
	async Validate() {
		/* let {parentID, childID} = this.payload;
		let childNode = await GetNodeAsync(childID);
		let parentNodes = await GetNodeParentsAsync(childNode);
		Assert(parentNodes.length > 1, "Cannot unlink this child, as doing so would orphan it. Try deleting it instead."); */
		const { mapID, childID } = this.payload;
		const oldData = await GetAsync(() => GetNodeL2(childID));
		const earlyError = await GetAsync(() => ForUnlink_GetError(this.userInfo.id, oldData, this.allowOrphaning));
		Assert(earlyError == null, earlyError);
	}

	GetDBUpdates() {
		const { parentID, childID } = this.payload;

		const updates = {};
		updates[`nodes/${childID}/.parents/.${parentID}`] = null;
		updates[`nodes/${parentID}/.children/.${childID}`] = null;
		if (this.parent_oldChildrenOrder) {
			updates[`nodes/${parentID}/.childrenOrder`] = this.parent_oldChildrenOrder.Except(childID).IfEmptyThen(null);
		}
		return updates;
	}
}

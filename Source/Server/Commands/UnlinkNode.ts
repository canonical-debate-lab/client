import { GetAsync } from 'Frame/Database/DatabaseHelpers';
import { Assert } from 'js-vextensions';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { ForUnlink_GetError } from '../../Store/firebase/nodes';
import { GetNodeL2 } from '../../Store/firebase/nodes/$node';
import { Command } from '../Command';
import { MapEdit, UserEdit } from '../CommandMacros';

@MapEdit
@UserEdit
export class UnlinkNode extends Command<{mapID: number, parentID: number, childID: number}, {}> {
	allowOrphaning = false; // could also be named "asPartOfCut", to be consistent with ForUnlink_GetError parameter

	parent_oldChildrenOrder: number[];
	async Prepare() {
		const { parentID, childID } = this.payload;
		this.parent_oldChildrenOrder = await GetDataAsync('nodes', parentID, '.childrenOrder') as number[];
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

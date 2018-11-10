import {GetAsync} from "Frame/Database/DatabaseHelpers";
import {Assert} from "js-vextensions";
import {GetDataAsync} from "../../Frame/Database/DatabaseHelpers";
import {ForUnlink_GetError} from "../../Store/firebase/nodes";
import {GetNodeL2} from "../../Store/firebase/nodes/$node";
import {Command} from "../Command";
import {MapEdit, UserEdit} from "../CommandMacros";

@MapEdit
@UserEdit
export default class UnlinkNode extends Command<{mapID: number, parentID: number, childID: number}> {
	parent_oldChildrenOrder: number[];
	async Prepare() {
		let {parentID, childID} = this.payload;
		this.parent_oldChildrenOrder = await GetDataAsync("nodes", parentID, "childrenOrder") as number[];
	}
	async Validate() {
		/*let {parentID, childID} = this.payload;
		let childNode = await GetNodeAsync(childID);
		let parentNodes = await GetNodeParentsAsync(childNode);
		Assert(parentNodes.length > 1, "Cannot unlink this child, as doing so would orphan it. Try deleting it instead.");*/
		let {mapID, childID} = this.payload;
		let oldData = await GetAsync(()=>GetNodeL2(childID));
		let earlyError = await GetAsync(()=>ForUnlink_GetError(this.userInfo.id, oldData));
		Assert(earlyError == null, earlyError);
	}
	
	GetDBUpdates() {
		let {parentID, childID} = this.payload;

		let updates = {};
		updates[`nodes/${childID}/parents/${parentID}`] = null;
		updates[`nodes/${parentID}/children/${childID}`] = null;
		if (this.parent_oldChildrenOrder) {
			updates[`nodes/${parentID}/childrenOrder`] = this.parent_oldChildrenOrder.Except(childID);
		}
		return updates;
	}
}
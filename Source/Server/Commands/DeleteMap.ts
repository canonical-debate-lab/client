import { UserEdit } from 'Server/CommandMacros';
import { DeleteNode } from 'Server/Commands/DeleteNode';
import { GetMap } from 'Store/firebase/maps';
import { GetAsync_Raw, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Command, MergeDBUpdates } from 'Utils/FrameworkOverrides';
import { Map } from '../../Store/firebase/maps/@Map';
import { UserMapInfoSet } from '../../Store/firebase/userMapInfo/@UserMapInfo';

@UserEdit
export class DeleteMap extends Command<{mapID: string}, {}> {
	oldData: Map;
	userMapInfoSets: {[key: string]: UserMapInfoSet};
	sub_deleteNode: DeleteNode;
	async Prepare() {
		const { mapID } = this.payload;
		this.oldData = await GetAsync_Raw(() => GetMap(mapID));
		this.userMapInfoSets = (await GetDataAsync('userMapInfo') as {[key: string]: UserMapInfoSet}) || {};

		this.sub_deleteNode = new DeleteNode({ mapID, nodeID: this.oldData.rootNode }).MarkAsSubcommand();
		this.sub_deleteNode.asPartOfMapDelete = true;
		this.sub_deleteNode.Validate_Early();
		await this.sub_deleteNode.Prepare();
	}
	async Validate() {
		await this.sub_deleteNode.Validate();
		// todo: use parents recursion on l2 nodes to make sure they're all connected to at least one other map root
	}

	GetDBUpdates() {
		const { mapID } = this.payload;
		let updates = this.sub_deleteNode.GetDBUpdates();

		const newUpdates = {};
		newUpdates[`maps/${mapID}`] = null;
		for (const { name: userID, value: userMapInfoSet } of this.userMapInfoSets.Props(true)) {
			for (const { name: mapID2, value: userMapInfo } of userMapInfoSet.Props(true)) {
				if (mapID2 == mapID) {
					newUpdates[`userMapInfo/${userID}/.${mapID}`] = null;
				}
			}
		}
		// delete entry in mapNodeEditTimes
		newUpdates[`mapNodeEditTimes/${mapID}`] = null;
		updates = MergeDBUpdates(updates, newUpdates);

		return updates;
	}
}

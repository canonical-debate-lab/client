import { Assert, ToInt } from 'js-vextensions';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { AddSchema, AssertValidate, Command, GetAsync, GetAsync_Raw, GetDataAsync, MergeDBUpdates, GetData_Query } from 'Utils/FrameworkOverrides';
import { GetNodeRevision, GetNodeRevisions } from 'Store/firebase/nodeRevisions';
import { GetMaps } from '../../Store/firebase/maps';
import { ForDelete_GetError } from '../../Store/firebase/nodes';
import { MapNodeL2 } from '../../Store/firebase/nodes/@MapNode';
import { MapEdit, UserEdit } from '../CommandMacros';

AddSchema({
	properties: {
		mapID: { type: 'string' },
		nodeID: { type: 'string' },
		withContainerArgument: { type: 'string' },
	},
	required: ['nodeID'],
}, 'DeleteNode_payload');

@MapEdit
@UserEdit
export class DeleteNode extends Command<{mapID?: string, nodeID: string, withContainerArgument?: string}, {}> {
	Validate_Early() {
		AssertValidate('DeleteNode_payload', this.payload, 'Payload invalid');
	}

	// as subcommand
	asPartOfMapDelete = false;
	childrenToIgnore = [] as string[];

	sub_deleteContainerArgument: DeleteNode;

	oldData: MapNodeL2;
	oldRevisions: MapNodeRevision[];
	oldParentChildrenOrders: string[][];
	// viewerIDs_main: string[];
	mapIDs: string[];
	async Prepare() {
		const { mapID, nodeID, withContainerArgument } = this.payload;

		this.oldData = await GetAsync_Raw(() => GetNodeL2(nodeID));
		// this.oldRevisions = await GetAsync(() => GetNodeRevisions(nodeID));
		// this.oldRevisions = await Promise.all(...oldRevisionIDs.map(id => GetDataAsync('nodeRevisions', id)));
		// this.oldRevisions = await Promise.all(...oldRevisionIDs.map(id => GetAsync(() => GetNodeRevision(id))));
		/* const oldRevisionIDs = await GetNodeRevisionIDsForNode_OneTime(nodeID);
		this.oldRevisions = await GetAsync(() => oldRevisionIDs.map(id => GetNodeRevision(id))); */
		this.oldRevisions = await GetAsync(() => GetNodeRevisions(nodeID));

		this.oldParentChildrenOrders = await Promise.all((this.oldData.parents || {}).VKeys().map(parentID => GetDataAsync('nodes', parentID, '.childrenOrder') as Promise<string[]>));

		// this.viewerIDs_main = await GetAsync(() => GetNodeViewers(nodeID));

		this.mapIDs = (await GetAsync(() => GetMaps())).map(a => a._key);

		if (withContainerArgument) {
			this.sub_deleteContainerArgument = new DeleteNode({ mapID, nodeID: withContainerArgument }).MarkAsSubcommand();
			this.sub_deleteContainerArgument.childrenToIgnore = [nodeID];
			this.sub_deleteContainerArgument.Validate_Early();
			await this.sub_deleteContainerArgument.Prepare();
		}
	}
	async Validate() {
		const { asPartOfMapDelete, childrenToIgnore } = this;
		/* Assert((this.oldData.parents || {}).VKeys(true).length <= 1, "Cannot delete this child, as it has more than one parent. Try unlinking it instead.");
		let normalChildCount = (this.oldData.children || {}).VKeys(true).length;
		Assert(normalChildCount == 0, "Cannot delete this node until all its (non-impact-premise) children have been unlinked or deleted."); */
		const earlyError = await GetAsync(() => ForDelete_GetError(this.userInfo.id, this.oldData, this.asSubcommand && { asPartOfMapDelete, childrenToIgnore }));
		Assert(earlyError == null, earlyError);
		if (this.sub_deleteContainerArgument) await this.sub_deleteContainerArgument.Validate();
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;
		let updates = {};

		// delete node's own data
		updates[`nodes/${nodeID}`] = null;
		// updates[`nodeExtras/${nodeID}`] = null;
		updates[`nodeRatings/${nodeID}`] = null;
		updates[`nodeViewers/${nodeID}`] = null;
		/* for (const viewerID of this.viewerIDs_main) {
			updates[`userViewedNodes/${viewerID}/.${nodeID}}`] = null;
		} */

		// delete links with parents
		for (const { index, name: parentID } of (this.oldData.parents || {}).Props()) {
			updates[`nodes/${parentID}/.children/.${nodeID}`] = null;
			// let parent_childrenOrder = this.oldParentID__childrenOrder[parentID];
			const parent_childrenOrder = this.oldParentChildrenOrders[index];
			if (parent_childrenOrder) {
				updates[`nodes/${parentID}/.childrenOrder`] = parent_childrenOrder.Except(nodeID).IfEmptyThen(null);
			}
		}

		// delete placement in layer
		if (this.oldData.layerPlusAnchorParents) {
			for (const layerPlusAnchorStr of this.oldData.layerPlusAnchorParents.VKeys()) {
				const [layerID, anchorNodeID] = layerPlusAnchorStr.split('+');
				updates[`layers/${layerID}/.nodeSubnodes/.${anchorNodeID}/.${nodeID}`] = null;
			}
		}

		// delete revisions
		for (const revision of this.oldRevisions) {
			updates[`nodeRevisions/${revision._key}`] = null;
		}

		// delete edit-time entry within each map (if it exists)
		for (const mapID of this.mapIDs) {
			updates[`mapNodeEditTimes/${mapID}/.${nodeID}`] = null;
		}

		if (this.sub_deleteContainerArgument) {
			updates = MergeDBUpdates(updates, this.sub_deleteContainerArgument.GetDBUpdates());
		}

		// todo: we also need to delete ourselves from our children's "parents" prop!

		return updates;
	}
}

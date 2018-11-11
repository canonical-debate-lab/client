import { GetAsync } from 'Frame/Database/DatabaseHelpers';
import { MapEdit } from 'Server/CommandMacros';
import { GetNode, GetHolderType, ForNewLink_GetError, ForLink_GetError } from 'Store/firebase/nodes';
import { Assert, E } from 'js-vextensions';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { GetUserPermissions, GetUserID } from 'Store/firebase/users';
import { ClaimForm, MapNode, Polarity } from './../../Store/firebase/nodes/@MapNode';
import { MapNodeType } from './../../Store/firebase/nodes/@MapNodeType';
import { Command, MergeDBUpdates } from './../Command';
import { UserEdit } from './../CommandMacros';
import { LinkNode } from './LinkNode';
import { UnlinkNode } from './UnlinkNode';
import { AddNode } from './AddNode';
import { AddChildNode } from './AddChildNode';
import { DeleteNode } from './DeleteNode';

type Payload = { mapID: number, oldParentID: number, newParentID: number, nodeID: number, newForm?: ClaimForm, newPolarity?: Polarity, unlinkFromOldParent?: boolean, deleteOrphanedArgumentWrapper?: boolean };

export function LinkNode_HighLevel_GetCommandError(command: LinkNode_HighLevel) {
	const { mapID, newParentID, nodeID, newForm, newPolarity } = command.payload;
	const permissions = GetUserPermissions('me');
	const node = GetNode(nodeID);
	if (node == null) return 'Node data not found.';
	const newParent = GetNode(newParentID);
	if (newParent == null) return 'New-parent data not found.';

	const createWrapperArg = node.type === MapNodeType.Claim && newParent.type === MapNodeType.Claim;
	if (createWrapperArg) {
		const argumentWrapper_partial = new MapNode({ type: MapNodeType.Argument });
		const error = ForNewLink_GetError(newParentID, argumentWrapper_partial, permissions);
		if (error) return error;
	} else {
		const error = ForNewLink_GetError(newParentID, node, permissions);
		if (error) return error;
	}
}

@MapEdit
@UserEdit
export class LinkNode_HighLevel extends Command<Payload> {
	Validate_Early() {
		const { oldParentID, nodeID } = this.payload;
		Assert(oldParentID !== nodeID, 'Parent-id and child-id cannot be the same!');
	}

	node_data: MapNode;
	newParent_data: MapNode;

	sub_addArgumentWrapper: AddChildNode;
	sub_linkToNewParent: LinkNode;
	sub_deleteOldParent: DeleteNode;
	sub_unlinkFromOldParent: UnlinkNode;
	async Prepare() {
		const { mapID, oldParentID, newParentID, nodeID, newForm, newPolarity, unlinkFromOldParent, deleteOrphanedArgumentWrapper } = this.payload;
		this.returnData = {};

		this.node_data = await GetAsync(() => GetNodeL2(nodeID));
		const oldParent_data = await GetAsync(() => GetNodeL2(oldParentID));
		this.newParent_data = await GetAsync(() => GetNodeL2(newParentID));

		let newParentID_forClaim = newParentID;

		const createWrapperArg = this.node_data.type === MapNodeType.Claim && this.newParent_data.type.IsOneOf(MapNodeType.Claim, MapNodeType.Argument);
		if (createWrapperArg) {
			Assert(newPolarity, 'Since this command has to create a wrapper-argument, you must supply the newPolarity property.');
			const argumentWrapper = new MapNode({ type: MapNodeType.Argument });
			const argumentWrapperRevision = new MapNodeRevision({});

			this.sub_addArgumentWrapper = new AddChildNode({
				mapID, parentID: newParentID, node: argumentWrapper, revision: argumentWrapperRevision,
				// link: E({ _: true }, newPolarity && { polarity: newPolarity }) as any,
				link: E({ _: true, polarity: newPolarity }) as any,
			}).MarkAsSubcommand();
			this.sub_addArgumentWrapper.Validate_Early();
			await this.sub_addArgumentWrapper.Prepare();

			this.returnData.argumentWrapperID = this.sub_addArgumentWrapper.sub_addNode.nodeID;
			newParentID_forClaim = this.sub_addArgumentWrapper.sub_addNode.nodeID;
		}

		this.sub_linkToNewParent = new LinkNode({ mapID, parentID: newParentID_forClaim, childID: nodeID, childForm: newForm, childPolarity: newPolarity }).MarkAsSubcommand();
		this.sub_linkToNewParent.Validate_Early();
		await this.sub_linkToNewParent.Prepare();

		if (unlinkFromOldParent) {
			// if the old parent was an argument, and the moved node was its only child, delete the old parent
			if (deleteOrphanedArgumentWrapper && oldParent_data.type === MapNodeType.Argument && oldParent_data.children.VKeys(true).length === 1) {
				this.sub_deleteOldParent = new DeleteNode({ mapID, nodeID: oldParentID }).MarkAsSubcommand();
				this.sub_deleteOldParent.childrenBeingDeleted = [nodeID]; // let DeleteNode sub that it doesn't need to wait for nodeID to be deleted (since we're moving it out from old-parent simultaneously with old-parent's deletion)
				this.sub_deleteOldParent.Validate_Early();
				await this.sub_deleteOldParent.Prepare();
			} else {
				this.sub_unlinkFromOldParent = new UnlinkNode({ mapID, parentID: oldParentID, childID: nodeID }).MarkAsSubcommand();
				this.sub_unlinkFromOldParent.Validate_Early();
				await this.sub_unlinkFromOldParent.Prepare();
			}
		}
	}
	async Validate() {
		if (this.sub_addArgumentWrapper) await this.sub_addArgumentWrapper.Validate();
		await this.sub_linkToNewParent.Validate();
		if (this.sub_deleteOldParent) await this.sub_deleteOldParent.Validate();
		if (this.sub_unlinkFromOldParent) await this.sub_unlinkFromOldParent.Validate();
	}

	GetDBUpdates() {
		let updates = {};
		if (this.sub_addArgumentWrapper) updates = MergeDBUpdates(updates, this.sub_addArgumentWrapper.GetDBUpdates());
		updates = MergeDBUpdates(updates, this.sub_linkToNewParent.GetDBUpdates());
		if (this.sub_deleteOldParent) updates = MergeDBUpdates(updates, this.sub_deleteOldParent.GetDBUpdates());
		if (this.sub_unlinkFromOldParent) updates = MergeDBUpdates(updates, this.sub_unlinkFromOldParent.GetDBUpdates());
		return updates;
	}
}

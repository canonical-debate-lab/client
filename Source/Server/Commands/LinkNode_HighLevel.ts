import { GetNode, GetHolderType, ForNewLink_GetError } from 'Store/firebase/nodes';
import { Assert, E } from 'js-vextensions';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { GetUserPermissionGroups, MeID } from 'Store/firebase/users';
import { GetAsync } from 'Utils/FrameworkOverrides';
import { ClaimForm, MapNode, Polarity } from './../../Store/firebase/nodes/@MapNode';
import { MapNodeType } from './../../Store/firebase/nodes/@MapNodeType';
import { Command, MergeDBUpdates } from 'Utils/FrameworkOverrides';
import { UserEdit } from './../CommandMacros';
import { LinkNode } from './LinkNode';
import { UnlinkNode } from './UnlinkNode';
import { AddNode } from './AddNode';
import { AddChildNode } from './AddChildNode';
import { DeleteNode } from './DeleteNode';

type Payload = {
	mapID: number, oldParentID: number, newParentID: number, nodeID: number,
	newForm?: ClaimForm, newPolarity?: Polarity, allowCreateWrapperArg?: boolean,
	unlinkFromOldParent?: boolean, deleteOrphanedArgumentWrapper?: boolean };

export function LinkNode_HighLevel_GetCommandError(command: LinkNode_HighLevel) {
	const { mapID, newParentID, nodeID, newForm, newPolarity } = command.payload;
	const permissions = GetUserPermissionGroups(MeID());
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

export class LinkNode_HighLevel extends Command<Payload, {argumentWrapperID?: number}> {
	static defaultPayload = { allowCreateWrapperArg: true };
	Validate_Early() {
		const { oldParentID, nodeID } = this.payload;
		Assert(oldParentID !== nodeID, 'Parent-id and child-id cannot be the same!');
	}

	node_data: MapNode;
	newParent_data: MapNode;

	sub_addArgumentWrapper: AddChildNode;
	sub_linkToNewParent: LinkNode;
	sub_unlinkFromOldParent: UnlinkNode;
	sub_deleteOldParent: DeleteNode;
	async Prepare() {
		const { mapID, oldParentID, newParentID, nodeID, newForm, allowCreateWrapperArg, unlinkFromOldParent, deleteOrphanedArgumentWrapper } = this.payload;
		let { newPolarity } = this.payload;
		this.returnData = {};

		this.node_data = await GetAsync(() => GetNodeL2(nodeID));
		const oldParent_data = await GetAsync(() => GetNodeL2(oldParentID));
		this.newParent_data = await GetAsync(() => GetNodeL2(newParentID));

		let newParentID_forClaim = newParentID;

		const canCreateWrapperArg = this.node_data.type === MapNodeType.Claim && this.newParent_data.type.IsOneOf(MapNodeType.Claim, MapNodeType.Argument);
		if (canCreateWrapperArg) {
			const createWrapperArg = canCreateWrapperArg && allowCreateWrapperArg;
			if (createWrapperArg) {
				// Assert(newPolarity, 'Since this command has to create a wrapper-argument, you must supply the newPolarity property.');
				newPolarity = newPolarity || Polarity.Supporting; // if new-polarity isn't supplied, just default to Supporting (this can happen if a claim is copied from search-results)
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
			} else {
				const mustCreateWrapperArg = canCreateWrapperArg && !this.newParent_data.multiPremiseArgument;
				Assert(mustCreateWrapperArg === false, `Linking node #${nodeID} under #${newParentID} requires creating a wrapper-arg, but this was disallowed by passed prop.`);
			}
		}

		this.sub_linkToNewParent = new LinkNode({ mapID, parentID: newParentID_forClaim, childID: nodeID, childForm: newForm, childPolarity: newPolarity }).MarkAsSubcommand();
		this.sub_linkToNewParent.Validate_Early();
		await this.sub_linkToNewParent.Prepare();

		if (unlinkFromOldParent) {
			this.sub_unlinkFromOldParent = new UnlinkNode({ mapID, parentID: oldParentID, childID: nodeID }).MarkAsSubcommand();
			this.sub_unlinkFromOldParent.allowOrphaning = true; // allow "orphaning" of nodeID, since we're going to reparent it simultaneously -- using the sub_linkToNewParent subcommand
			this.sub_unlinkFromOldParent.Validate_Early();
			await this.sub_unlinkFromOldParent.Prepare();

			// if the old parent was an argument, and the moved node was its only child, also delete the old parent
			if (deleteOrphanedArgumentWrapper && oldParent_data.type === MapNodeType.Argument && oldParent_data.children.VKeys(true).length === 1) {
				this.sub_deleteOldParent = new DeleteNode({ mapID, nodeID: oldParentID }).MarkAsSubcommand();
				this.sub_deleteOldParent.childrenToIgnore = [nodeID]; // let DeleteNode sub that it doesn't need to wait for nodeID to be deleted (since we're moving it out from old-parent simultaneously with old-parent's deletion)
				this.sub_deleteOldParent.Validate_Early();
				await this.sub_deleteOldParent.Prepare();
			}
		}
	}
	async Validate() {
		if (this.sub_addArgumentWrapper) await this.sub_addArgumentWrapper.Validate();
		await this.sub_linkToNewParent.Validate();
		if (this.sub_unlinkFromOldParent) await this.sub_unlinkFromOldParent.Validate();
		if (this.sub_deleteOldParent) await this.sub_deleteOldParent.Validate();
	}

	GetDBUpdates() {
		let updates = {};
		if (this.sub_addArgumentWrapper) updates = MergeDBUpdates(updates, this.sub_addArgumentWrapper.GetDBUpdates());
		updates = MergeDBUpdates(updates, this.sub_linkToNewParent.GetDBUpdates());
		if (this.sub_unlinkFromOldParent) updates = MergeDBUpdates(updates, this.sub_unlinkFromOldParent.GetDBUpdates());
		if (this.sub_deleteOldParent) updates = MergeDBUpdates(updates, this.sub_deleteOldParent.GetDBUpdates());
		return updates;
	}
}

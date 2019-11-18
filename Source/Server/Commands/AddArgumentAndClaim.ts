import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { MapNodeRevision } from 'Store_Old/firebase/nodes/@MapNodeRevision';
import { Command, MergeDBUpdates } from 'Utils/FrameworkOverrides';
import { ChildEntry, MapNode } from '../../Store_Old/firebase/nodes/@MapNode';
import { AddChildNode } from './AddChildNode';

type Payload = {
	mapID: string,
	argumentParentID: string, argumentNode: MapNode, argumentRevision: MapNodeRevision, argumentLink?: ChildEntry,
	claimNode: MapNode, claimRevision: MapNodeRevision, claimLink?: ChildEntry,
};

export class AddArgumentAndClaim extends Command<Payload, {argumentNodeID: string, argumentRevisionID: string, claimNodeID: string, claimRevisionID: string}> {
	sub_addArgument: AddChildNode;
	sub_addClaim: AddChildNode;
	async Prepare() {
		const { mapID, argumentParentID, argumentNode, argumentRevision, argumentLink, claimNode, claimRevision, claimLink } = this.payload;

		this.sub_addArgument = new AddChildNode({
			mapID, parentID: argumentParentID, node: argumentNode, revision: argumentRevision, link: argumentLink,
		}).MarkAsSubcommand();
		this.sub_addArgument.Validate_Early();
		await this.sub_addArgument.Prepare();

		this.sub_addClaim = new AddChildNode({ mapID, parentID: this.sub_addArgument.returnData.nodeID, node: claimNode, revision: claimRevision, link: claimLink }).MarkAsSubcommand();
		/* this.sub_addClaim.lastNodeID_addAmount = 1;
		this.sub_addClaim.lastNodeRevisionID_addAmount = 1; */
		this.sub_addClaim.Validate_Early();
		await this.sub_addClaim.Prepare();
		this.sub_addClaim.parent_oldData = argumentNode; // we need to do this so add-claim sub knows it's child of argument, and thus updates the children-order prop of the argument

		this.returnData = {
			argumentNodeID: this.sub_addArgument.sub_addNode.nodeID,
			argumentRevisionID: this.sub_addArgument.sub_addNode.sub_addRevision.revisionID,
			claimNodeID: this.sub_addClaim.sub_addNode.nodeID,
			claimRevisionID: this.sub_addClaim.sub_addNode.sub_addRevision.revisionID,
		};
	}
	async Validate() {
		await this.sub_addArgument.Validate();
		await this.sub_addClaim.Validate();
	}

	GetDBUpdates() {
		let updates = {};
		updates = MergeDBUpdates(updates, this.sub_addArgument.GetDBUpdates());
		updates = MergeDBUpdates(updates, this.sub_addClaim.GetDBUpdates());
		return updates;
	}
}

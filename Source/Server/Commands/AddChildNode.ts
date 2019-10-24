import { Assert } from 'js-vextensions';
import { MapEdit, UserEdit } from '../../Server/CommandMacros';
import { GetNode } from '../../Store/firebase/nodes';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from '../../Store/firebase/nodes/@MapNodeType';
import { AssertValidate, Command, GetAsync, MergeDBUpdates } from '../../Utils/FrameworkOverrides';
import { ChildEntry, MapNode } from '../../Store/firebase/nodes/@MapNode';
import { AddNode } from './AddNode';

type Payload = {mapID: string, parentID: string, node: MapNode, revision: MapNodeRevision, link?: ChildEntry, asMapRoot?: boolean};

@MapEdit
@UserEdit
export class AddChildNode extends Command<Payload, {nodeID: string, revisionID: string}> {
	// set these from parent command if the parent command has earlier subs that increment last-node-id, etc.
	/* lastNodeID_addAmount = 0;
	lastNodeRevisionID_addAmount = 0; */

	Validate_Early() {
		const { node } = this.payload;
		Assert(node.parents == null, 'node.parents must be empty. Instead, supply a parentID property in the payload.');
	}

	sub_addNode: AddNode;
	parent_oldData: MapNode;
	async Prepare() {
		const { mapID, parentID, node, revision, link, asMapRoot } = this.payload;

		const node_withParents = node.Extended(parentID ? { parents: { [parentID]: { _: true } } } : {});
		this.sub_addNode = new AddNode({ mapID, node: node_withParents, revision }).MarkAsSubcommand();
		// this.sub_addNode.VSet({ lastNodeID_addAmount: this.lastNodeID_addAmount, lastNodeRevisionID_addAmount: this.lastNodeRevisionID_addAmount });
		this.sub_addNode.Validate_Early();
		await this.sub_addNode.Prepare();

		this.payload.link = link || { _: true };

		if (!asMapRoot) {
			// this.parent_oldChildrenOrder = await GetDataAsync('nodes', parentID, '.childrenOrder') as number[];
			this.parent_oldData = await GetAsync(() => GetNode(parentID));
		}

		this.returnData = {
			nodeID: this.sub_addNode.nodeID,
			revisionID: this.sub_addNode.sub_addRevision.revisionID,
		};
	}
	async Validate() {
		const { node, link, asMapRoot } = this.payload;
		await this.sub_addNode.Validate();
		if (!asMapRoot) {
			AssertValidate('ChildEntry', link, 'Link invalid');
		}
	}

	GetDBUpdates() {
		const { parentID, link, asMapRoot } = this.payload;
		const updates = this.sub_addNode.GetDBUpdates();

		const newUpdates = {};
		// add as child of parent
		if (!asMapRoot) {
			newUpdates[`nodes/${parentID}/.children/.${this.sub_addNode.nodeID}`] = link;
			// if this node is being placed as a child of an argument, update the argument's children-order property
			if (this.parent_oldData && this.parent_oldData.type == MapNodeType.Argument) {
				newUpdates[`nodes/${parentID}/.childrenOrder`] = (this.parent_oldData.childrenOrder || []).concat([this.sub_addNode.nodeID]);
			}
		}

		return MergeDBUpdates(updates, newUpdates);
	}
}

import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { Assert } from 'js-vextensions';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { ChildEntry, MapNode } from '../../Store/firebase/nodes/@MapNode';
import { Command, MergeDBUpdates } from '../Command';
import { AddNode } from './AddNode';

@MapEdit
@UserEdit
export class AddChildNode extends Command
		<{mapID: number, parentID: number, node: MapNode, revision: MapNodeRevision, link?: ChildEntry, asMapRoot?: boolean}> {
	Validate_Early() {
		const { node } = this.payload;
		Assert(node.parents == null, 'node.parents must be empty. Instead, supply a parentID property in the payload.');
	}

	sub_addNode: AddNode;
	parent_oldChildrenOrder: number[];
	async Prepare() {
		const { mapID, parentID, node, revision, link, asMapRoot } = this.payload;

		const node_withParents = node.Extended(parentID ? { parents: { [parentID]: true } } : {});
		this.sub_addNode = new AddNode({ mapID, node: node_withParents, revision }).MarkAsSubcommand();
		await this.sub_addNode.Prepare();

		this.payload.link = link || { _: true };

		if (!asMapRoot) {
			this.parent_oldChildrenOrder = await GetDataAsync('nodes', parentID, 'childrenOrder') as number[];
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
			newUpdates[`nodes/${parentID}/children/${this.sub_addNode.nodeID}`] = link;
			if (this.parent_oldChildrenOrder) {
				newUpdates[`nodes/${parentID}/childrenOrder`] = this.parent_oldChildrenOrder.concat([this.sub_addNode.nodeID]);
			}
		}

		return MergeDBUpdates(updates, newUpdates);
	}
}

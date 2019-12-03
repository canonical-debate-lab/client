import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { Assert } from 'js-vextensions';
import { GetSchemaJSON, AssertValidate, AssertValidate_Full } from 'Utils/FrameworkOverrides';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { Command, MergeDBUpdates } from 'mobx-firelink';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { AddNodeRevision } from './AddNodeRevision';

/** Do not use this from client-side code. This is only to be used internally, by higher-level commands -- usually AddChildNode. */
export class AddNode extends Command<{mapID: string, node: MapNode, revision: MapNodeRevision}, {}> {
	// set these from parent command if the parent command has earlier subs that increment last-node-id, etc.
	/* lastNodeID_addAmount = 0;
	lastNodeRevisionID_addAmount = 0; */

	sub_addRevision: AddNodeRevision;
	Validate_Early() {
		const { node, revision } = this.payload;
		Assert(node.currentRevision == null, "Cannot specifiy node's revision-id. It will be generated automatically.");
		Assert(revision.node == null, "Cannot specifiy revision's node-id. It will be generated automatically.");
	}

	nodeID: string;
	parentID: string;
	parent_oldChildrenOrder: number[];
	async Prepare() {
		const { mapID, node, revision } = this.payload;

		// this.nodeID = (await GetDataAsync('general', 'data', '.lastNodeID') as number) + this.lastNodeID_addAmount + 1;
		this.nodeID = GenerateUUID();
		node.creator = this.userInfo.id;
		node.createdAt = Date.now();

		this.sub_addRevision = new AddNodeRevision({ mapID, revision }).MarkAsSubcommand();
		// this.sub_addRevision.lastNodeRevisionID_addAmount = this.lastNodeRevisionID_addAmount;
		await this.sub_addRevision.Prepare();

		node.currentRevision = this.sub_addRevision.revisionID;
		revision.node = this.nodeID;
	}
	async Validate() {
		const { node } = this.payload;
		if (this.asSubcommand) {
			const mapNodeSchema = GetSchemaJSON('MapNode');
			// if as subcommand, we might be called by AddChildNode for new argument; in that case, ignore the "childrenOrder" prop requirement (gets added by later link-impact-node subcommand)
			delete mapNodeSchema['allOf'];

			AssertValidate_Full(mapNodeSchema, 'MapNode', node, 'Node invalid');
		} else {
			AssertValidate('MapNode', node, 'Node invalid');
		}
		await this.sub_addRevision.Validate();
	}

	GetDBUpdates() {
		const { node } = this.payload;

		let updates = {};
		// add node
		// updates['general/data/.lastNodeID'] = this.nodeID;
		updates[`nodes/${this.nodeID}`] = node;

		// add as parent of (pre-existing) children
		for (const childID of (node.children || {}).VKeys()) {
			updates[`nodes/${childID}/.parents/.${this.nodeID}`] = { _: true };
		}

		updates = MergeDBUpdates(updates, this.sub_addRevision.GetDBUpdates());

		return updates;
	}
}

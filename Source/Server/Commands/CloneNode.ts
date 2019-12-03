import { DEL, E, Clone } from 'js-vextensions';
import { Command, MergeDBUpdates, SplitStringBySlash_Cached, GetAsync } from 'mobx-firelink';
import { GetLinkAtPath, GetNodeForm, GetNodeL2 } from '../../Store/firebase/nodes/$node';
import { ClaimForm, MapNode, Polarity } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeType } from '../../Store/firebase/nodes/@MapNodeType';
import { AddChildNode } from './AddChildNode';
import { LinkNode } from './LinkNode';

export class CloneNode extends Command<{mapID: string, baseNodePath: string, newParentID: string}, {nodeID: string, revisionID: string}> {
	sub_addNode: AddChildNode;
	sub_linkChildren: LinkNode[];
	async Prepare() {
		const { mapID, baseNodePath, newParentID } = this.payload;

		// prepare add-node
		// ==========

		const baseNodeID = SplitStringBySlash_Cached(baseNodePath).Last();
		const baseNode = await GetAsync(() => GetNodeL2(baseNodeID));
		const isArgument = baseNode.type == MapNodeType.Argument;

		const nodeForm = await GetAsync(() => GetNodeForm(baseNode, baseNodePath)) as ClaimForm;
		const nodePolarity = await GetAsync(() => GetLinkAtPath(baseNodePath).polarity) as Polarity;

		const newChildNode = Clone(baseNode).VSet({ children: DEL, childrenOrder: DEL, currentRevision: DEL, current: DEL, parents: DEL }) as MapNode;

		const newChildRevision = Clone(baseNode.current).VSet({ node: DEL });

		this.sub_addNode = new AddChildNode({
			mapID, parentID: newParentID, node: newChildNode, revision: newChildRevision,
			link: E(
				{ _: true },
				nodeForm && { form: nodeForm },
				nodePolarity && { polarity: nodePolarity },
			) as any,
		}).MarkAsSubcommand();
		this.sub_addNode.Validate_Early();
		await this.sub_addNode.Prepare();

		// prepare link-children
		// ==========

		let childrenToLink = (baseNode.children || {}).VKeys(true);
		if (isArgument) {
			// if argument, use childrenOrder instead, since it's sorted
			childrenToLink = (baseNode.childrenOrder || []).slice();
			childrenToLink.Remove(baseNode.childrenOrder[0]); // but don't link old-impact-premise
		}

		this.sub_linkChildren = [];
		for (const childID of childrenToLink) {
			const child = await GetAsync(() => GetNodeL2(childID));
			const childForm = await GetAsync(() => GetNodeForm(child, `${baseNodePath}/${childID}`)) as ClaimForm;
			const linkChildSub = new LinkNode({ mapID, parentID: this.sub_addNode.sub_addNode.nodeID, childID, childForm }).MarkAsSubcommand();
			linkChildSub.Validate_Early();

			// linkChildSub.Prepare([]);
			/* let dbUpdates = this.GetDBUpdates();
			let node_childrenOrder = dbUpdates[`nodes/${this.sub_addNode.nodeID}/childrenOrder`];
			linkChildSub.Prepare(node_childrenOrder); */
			await linkChildSub.Prepare();

			this.sub_linkChildren.push(linkChildSub);
		}

		this.returnData = this.sub_addNode.returnData;
	}
	async Validate() {
		this.sub_addNode.Validate();
		for (const sub of this.sub_linkChildren) {
			sub.Validate();
		}
	}

	GetDBUpdates() {
		let updates = this.sub_addNode.GetDBUpdates();
		for (const sub of this.sub_linkChildren) {
			// updates.Extend(sub.GetDBUpdates());
			updates = MergeDBUpdates(updates, sub.GetDBUpdates());
		}

		// override the setting of new-node/childrenOrder (otherwise each link-node sub-command tries to set it to: [old-list] + [its-own-child])
		// updates[`nodes/${this.sub_addNode.nodeID}/childrenOrder`] = this.sub_linkChildren.map(a=>a.payload.childID);
		if (this.sub_addNode.payload.node.type == MapNodeType.Argument) {
			const childrenOrder = [];
			childrenOrder.push(...this.sub_linkChildren.map((a) => a.payload.childID));
			updates[`nodes/${this.sub_addNode.sub_addNode.nodeID}`].childrenOrder = childrenOrder;
		}

		return updates;
	}
}

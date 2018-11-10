import { SplitStringBySlash_Cached } from "Frame/Database/StringSplitCache";
import { DEL, E } from "js-vextensions";
import { GetAsync_Raw, RemoveHelpers } from "../../Frame/Database/DatabaseHelpers";
import { GetLinkAtPath, GetNodeForm, GetNodeL2 } from "../../Store/firebase/nodes/$node";
import { ClaimForm, MapNode, Polarity } from "../../Store/firebase/nodes/@MapNode";
import { MapNodeType } from "../../Store/firebase/nodes/@MapNodeType";
import { Command, MergeDBUpdates } from "../Command";
import AddChildNode from "./AddChildNode";
import LinkNode from "./LinkNode";

export default class CloneNode extends Command<{mapID: number, baseNodePath: string, newParentID: number}> {
	sub_addNode: AddChildNode;
	sub_linkChildren: LinkNode[];
	async Prepare() {
		let {mapID, baseNodePath, newParentID} = this.payload;

		// prepare add-node
		// ==========

		let baseNodeID = SplitStringBySlash_Cached(baseNodePath).Last().ToInt();
		let baseNode = await GetAsync_Raw(()=>GetNodeL2(baseNodeID));
		let isArgument = baseNode.type == MapNodeType.Argument;
		
		let nodeForm = await GetAsync_Raw(()=>GetNodeForm(baseNode, baseNodePath)) as ClaimForm;
		let nodePolarity = await GetAsync_Raw(()=>GetLinkAtPath(baseNodePath).polarity) as Polarity;

		let newChildNode = RemoveHelpers(Clone(baseNode))
			.VSet({children: DEL, childrenOrder: DEL, currentRevision: DEL, current: DEL}) as MapNode;
		newChildNode.parents = {[newParentID]: {_: true}}; // make new node's only parent the one on this path

		let newChildRevision = Clone(baseNode.current).VSet({node: DEL});

		this.sub_addNode = new AddChildNode({
			mapID, node: newChildNode, revision: newChildRevision,
			link: E(
				{_: true},
				nodeForm && {form: nodeForm},
				nodePolarity && {polarity: nodePolarity},
			) as any,
		});
		this.sub_addNode.Validate_Early();
		await this.sub_addNode.Prepare();

		// prepare link-children
		// ==========

		let childrenToLink = (baseNode.children || {}).VKeys(true).map(a=>a.ToInt());
		if (isArgument) {
			// if argument, use childrenOrder instead, since it's sorted
			childrenToLink = (baseNode.childrenOrder || []).slice();
			childrenToLink.Remove(baseNode.childrenOrder[0]); // but don't link old-impact-premise
		}

		this.sub_linkChildren = [];
		for (let childID of childrenToLink) {
			let child = await GetAsync_Raw(()=>GetNodeL2(childID));
			let childForm = await GetAsync_Raw(()=>GetNodeForm(child, baseNodePath + "/" + childID)) as ClaimForm;
			let linkChildSub = new LinkNode({mapID, parentID: this.sub_addNode.sub_addNode.nodeID, childID: childID, childForm}).MarkAsSubcommand();
			linkChildSub.Validate_Early();

			//linkChildSub.Prepare([]);
			/*let dbUpdates = this.GetDBUpdates();
			let node_childrenOrder = dbUpdates[`nodes/${this.sub_addNode.nodeID}/childrenOrder`];
			linkChildSub.Prepare(node_childrenOrder);*/
			await linkChildSub.Prepare();

			this.sub_linkChildren.push(linkChildSub);
		}

		this.returnData = this.sub_addNode.returnData;
	}
	async Validate() {
		this.sub_addNode.Validate();
		for (let sub of this.sub_linkChildren) {
			sub.Validate();
		}
	}
	
	GetDBUpdates() {
		let updates = this.sub_addNode.GetDBUpdates();
		for (let sub of this.sub_linkChildren) {
			//updates.Extend(sub.GetDBUpdates());
			updates = MergeDBUpdates(updates, sub.GetDBUpdates());
		}

		// override the setting of new-node/childrenOrder (otherwise each link-node sub-command tries to set it to: [old-list] + [its-own-child])
		//updates[`nodes/${this.sub_addNode.nodeID}/childrenOrder`] = this.sub_linkChildren.map(a=>a.payload.childID);
		if (this.sub_addNode.payload.node.type == MapNodeType.Argument) {
			let childrenOrder = [];
			childrenOrder.push(...this.sub_linkChildren.map(a=>a.payload.childID));
			updates[`nodes/${this.sub_addNode.sub_addNode.nodeID}`].childrenOrder = childrenOrder;
		}

		return updates;
	}
}
import { UserEdit } from 'Server/CommandMacros';
import { Layer } from 'Store/firebase/layers/@Layer';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { GetLayer } from '../../Store/firebase/layers';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { AddNode } from './AddNode';
import {Command, MergeDBUpdates} from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';

@UserEdit
export class AddSubnode extends Command<{mapID: string, layerID: string, anchorNodeID: string, subnode: MapNode, subnodeRevision: MapNodeRevision}, number> {
	sub_addNode: AddNode;
	layer_oldData: Layer;
	async Prepare() {
		const { mapID, layerID, anchorNodeID, subnode, subnodeRevision } = this.payload;

		this.sub_addNode = new AddNode({ mapID, node: subnode, revision: subnodeRevision }).MarkAsSubcommand();
		await this.sub_addNode.Prepare();

		this.layer_oldData = await GetAsync(() => GetLayer(layerID));

		this.returnData = this.sub_addNode.nodeID;
	}
	async Validate() {
		await this.sub_addNode.Validate();
	}

	GetDBUpdates() {
		const { layerID, anchorNodeID, subnode } = this.payload;
		const updates = this.sub_addNode.GetDBUpdates();

		const newUpdates = {};
		// add into layer
		newUpdates[`layers/${layerID}/.nodeSubnodes/.${anchorNodeID}/.${this.sub_addNode.nodeID}`] = true;
		const layerPlusAnchorStr = `${layerID}+${anchorNodeID}`;
		newUpdates[`nodes/${this.sub_addNode.nodeID}/.layerPlusAnchorParents/.${layerPlusAnchorStr}`] = true;
		/* newUpdates[`nodes/${this.sub_addNode.nodeID}/.layerOwner`] = layerID;
		newUpdates[`nodes/${this.sub_addNode.nodeID}/.layerAnchorNode`] = anchorNodeID; */

		return MergeDBUpdates(updates, newUpdates);
	}
}

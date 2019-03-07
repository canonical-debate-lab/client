import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { Map } from '../../Store/firebase/maps/@Map';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from '../../Store/firebase/nodes/@MapNodeType';
import { Command, MergeDBUpdates } from 'Utils/FrameworkOverrides';
import { AddChildNode } from './AddChildNode';

@UserEdit
export class AddMap extends Command<{map: Map}, {}> {
	mapID: number;
	sub_addNode: AddChildNode;
	async Prepare() {
		const { map } = this.payload;

		const lastMapID = await GetDataAsync('general', 'data', '.lastMapID') as number;
		this.mapID = lastMapID + 1;
		map.createdAt = Date.now();
		map.editedAt = map.createdAt;

		const newRootNode = new MapNode({ type: MapNodeType.Category, creator: map.creator });
		const newRootNodeRevision = new MapNodeRevision({ titles: { base: 'Root' }, votingDisabled: true });
		this.sub_addNode = new AddChildNode({ mapID: this.mapID, parentID: null, node: newRootNode, revision: newRootNodeRevision, asMapRoot: true }).MarkAsSubcommand();
		this.sub_addNode.Validate_Early();
		await this.sub_addNode.Prepare();

		map.rootNode = this.sub_addNode.sub_addNode.nodeID;
	}
	async Validate() {
		const { map } = this.payload;
		AssertValidate('Map', map, 'Map invalid');
		await this.sub_addNode.Validate();
	}

	GetDBUpdates() {
		const { map } = this.payload;

		let updates = {};
		updates['general/data/.lastMapID'] = this.mapID;
		updates[`maps/${this.mapID}`] = map;
		updates = MergeDBUpdates(updates, this.sub_addNode.GetDBUpdates());

		return updates;
	}
}

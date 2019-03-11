import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import { GetDataAsync } from 'Utils/FrameworkOverrides';
import { Command, MergeDBUpdates } from 'Utils/FrameworkOverrides';
import { Map } from '../../Store/firebase/maps/@Map';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from '../../Store/firebase/nodes/@MapNodeType';
import { AddChildNode } from './AddChildNode';
import { GenerateUUID } from 'Utils/General/KeyGenerator';

@UserEdit
export class AddMap extends Command<{map: Map}, {}> {
	mapID: string;
	sub_addNode: AddChildNode;
	async Prepare() {
		const { map } = this.payload;

		this.mapID = GenerateUUID();
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

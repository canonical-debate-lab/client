import { GetAsync } from 'Frame/Database/DatabaseHelpers';
import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { GetNode } from 'Store/firebase/nodes';
import { WrapData } from 'Server/Server';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';
import { Command } from '../Command';

@MapEdit
@UserEdit
export class AddNodeRevision extends Command<{mapID: number, revision: MapNodeRevision}, number> {
	lastNodeRevisionID_addAmount = 0;

	Validate_Early() {
		const { revision } = this.payload;
	}

	revisionID: number;
	node_oldData: MapNode;
	async Prepare() {
		const { revision } = this.payload;

		this.revisionID = (await GetDataAsync('general', 'data', '.lastNodeRevisionID')) + this.lastNodeRevisionID_addAmount + 1;
		revision.creator = this.userInfo.id;
		revision.createdAt = Date.now();
		this.node_oldData = await GetAsync(() => GetNode(revision.node));

		this.returnData = this.revisionID;
	}
	async Validate() {
		const { revision } = this.payload;
		AssertValidate('MapNodeRevision', revision, 'Revision invalid');
	}

	GetDBUpdates() {
		const { mapID, revision } = this.payload;

		const updates = {};
		updates['general/data/.lastNodeRevisionID'] = this.revisionID;
		updates[`nodes/${revision.node}/.currentRevision`] = this.revisionID;
		updates[`nodeRevisions/${this.revisionID}`] = revision;
		updates[`maps/${mapID}/nodeEditTimes/data/.${revision.node}`] = revision.createdAt;
		return updates;
	}
}

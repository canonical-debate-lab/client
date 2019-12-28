import { MapEdit, UserEdit } from 'Server/CommandMacros';
import { GetNode } from 'Store/firebase/nodes';
import { AssertValidate } from 'vwebapp-framework';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { Command_Old, GetAsync, Command, AssertV } from 'mobx-firelink';
import { Assert } from 'js-vextensions';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';

/** Returned terms are all lowercase. */
export function GetSearchTerms(str: string) {
	return GetSearchTerms_Advanced(str, false).wholeTerms;
}
/** Returned terms are all lowercase. */
export function GetSearchTerms_Advanced(str: string, separateTermsWithWildcard = true) {
	const terms = str.toLowerCase().replace(/[^a-zA-Z0-9*]/g, ' ').replace(/ +/g, ' ').trim().split(' ').filter(a=>a != ""); // eslint-disable-line
	const wholeTerms = terms.filter((a) => (separateTermsWithWildcard ? !a.includes('*') : true)).map((a) => a.replace(/\*/g, '')).Distinct();
	const partialTerms = terms.filter((a) => (separateTermsWithWildcard ? a.includes('*') : false)).map((a) => a.replace(/\*/g, '')).Distinct();
	return { wholeTerms, partialTerms };
}

@MapEdit
@UserEdit
export class AddNodeRevision extends Command<{mapID: string, revision: MapNodeRevision}, number> {
	// lastNodeRevisionID_addAmount = 0;

	revisionID: string;
	node_oldData: MapNode;
	Validate() {
		const { revision } = this.payload;

		// this.revisionID = (await GetDataAsync('general', 'data', '.lastNodeRevisionID')) + this.lastNodeRevisionID_addAmount + 1;
		this.revisionID = this.revisionID ?? GenerateUUID();
		revision.creator = this.userInfo.id;
		revision.createdAt = Date.now();

		const titles_joined = (revision.titles || {}).VValues(true).join(' ');
		revision.titles.allTerms = GetSearchTerms(titles_joined).ToMap((a) => a, () => true);

		if (this.parentCommand == null) {
			this.node_oldData = GetNode(revision.node);
			AssertV(this.node_oldData, 'node_oldData is null.');
		}

		this.returnData = this.revisionID;

		AssertValidate('MapNodeRevision', revision, 'Revision invalid');
	}

	GetDBUpdates() {
		const { mapID, revision } = this.payload;

		const updates = {};
		// updates['general/data/.lastNodeRevisionID'] = this.revisionID;
		updates[`nodes/${revision.node}/.currentRevision`] = this.revisionID;
		updates[`nodeRevisions/${this.revisionID}`] = revision;
		// updates[`maps/${mapID}/nodeEditTimes/data/.${revision.node}`] = revision.createdAt;
		updates[`mapNodeEditTimes/${mapID}/.${revision.node}`] = revision.createdAt;
		return updates;
	}
}

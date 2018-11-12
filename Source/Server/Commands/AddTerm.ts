import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Term } from '../../Store/firebase/terms/@Term';
import { Command } from '../Command';

@UserEdit
export class AddTerm extends Command<{term: Term}, {}> {
	termID: number;
	async Prepare() {
		const lastTermID = await GetDataAsync('general', 'lastTermID') as number;
		this.termID = lastTermID + 1;
		this.payload.term.createdAt = Date.now();
	}
	async Validate() {
		const { term } = this.payload;
		AssertValidate('Term', term, 'Term invalid');
	}

	GetDBUpdates() {
		const { term } = this.payload;
		const updates = {
			'general/lastTermID': this.termID,
			[`terms/${this.termID}`]: term,
			[`termNames/${term.name.toLowerCase()}/${this.termID}`]: true,
		};
		return updates;
	}
}
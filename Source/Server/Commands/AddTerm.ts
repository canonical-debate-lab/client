import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { Term } from '../../Store/firebase/terms/@Term';
import { Command } from '../Command';

@UserEdit
export class AddTerm extends Command<{term: Term}, {}> {
	termID: number;
	async Prepare() {
		const lastTermID = await GetDataAsync('general', 'data', '.lastTermID') as number;
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
			'general/data/.lastTermID': this.termID,
			[`terms/${this.termID}`]: term,
			[`termNames/${term.name.toLowerCase()}/.${this.termID}`]: true,
		};
		return updates;
	}
}

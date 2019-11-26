import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import {GenerateUUID} from 'Utils/General/KeyGenerator';
import { Term } from '../../Store/firebase/terms/@Term';
import {Command} from 'mobx-firelink';

@UserEdit
export class AddTerm extends Command<{term: Term}, {}> {
	termID: string;
	async Prepare() {
		const { term } = this.payload;

		this.termID = GenerateUUID();
		term.creator = this.userInfo.id;
		term.createdAt = Date.now();
	}
	async Validate() {
		const { term } = this.payload;
		AssertValidate('Term', term, 'Term invalid');
	}

	GetDBUpdates() {
		const { term } = this.payload;
		const updates = {
			// 'general/data/.lastTermID': this.termID,
			[`terms/${this.termID}`]: term,
			[`termNames/${term.name.toLowerCase()}/.${this.termID}`]: true,
		};
		return updates;
	}
}

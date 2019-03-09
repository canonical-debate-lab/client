import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate, Command, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Term } from '../../Store/firebase/terms/@Term';

@UserEdit
export class AddTerm extends Command<{term: Term}, {}> {
	termID: number;
	async Prepare() {
		const { term } = this.payload;

		const lastTermID = await GetDataAsync('general', 'data', '.lastTermID') as number;
		this.termID = lastTermID + 1;
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
			'general/data/.lastTermID': this.termID,
			[`terms/${this.termID}`]: term,
			[`termNames/${term.name.toLowerCase()}/.${this.termID}`]: true,
		};
		return updates;
	}
}

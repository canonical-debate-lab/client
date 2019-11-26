import { UserEdit } from 'Server/CommandMacros';
import { GetAsync } from 'Utils/LibIntegrations/MobXFirelink';
import { GetTerm } from 'Store/firebase/terms';
import {Command} from 'mobx-firelink';
import { Term } from '../../Store/firebase/terms/@Term';

@UserEdit
export class DeleteTerm extends Command<{termID: string}, {}> {
	oldData: Term;
	async Prepare() {
		const { termID } = this.payload;
		this.oldData = await GetAsync(() => GetTerm(termID));
	}
	async Validate() {}

	GetDBUpdates() {
		const { termID } = this.payload;
		const updates = {
			[`terms/${termID}`]: null,
			[`termNames/${this.oldData.name.toLowerCase()}/.${termID}`]: null,
		};
		return updates;
	}
}

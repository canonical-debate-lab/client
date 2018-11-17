import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Term } from '../../Store/firebase/terms/@Term';
import { Command } from '../Command';

@UserEdit
export class DeleteTerm extends Command<{termID: number}, {}> {
	oldData: Term;
	async Prepare() {
		const { termID } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'terms', termID) as Term;
	}
	async Validate() {
	}

	GetDBUpdates() {
		const { termID } = this.payload;
		const updates = {
			[`terms/${termID}`]: null,
			[`termNames/${this.oldData.name.toLowerCase()}/.${termID}`]: null,
		};
		return updates;
	}
}

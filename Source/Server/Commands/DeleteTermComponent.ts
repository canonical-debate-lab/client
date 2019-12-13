import { UserEdit } from 'Server/CommandMacros';
import { Command, GetAsync } from 'mobx-firelink';
import { GetTermComponent } from 'Store/firebase/termComponents';
import { TermComponent } from '../../Store/firebase/termComponents/@TermComponent';

@UserEdit
export class DeleteTermComponent extends Command<{termComponentID: string}, {}> {
	Validate_Early() {}

	oldData: TermComponent;
	async Prepare() {
		const { termComponentID } = this.payload;
		this.oldData = await GetAsync(() => GetTermComponent(termComponentID));
	}
	async Validate() {
	}

	GetDBUpdates() {
		const { termComponentID } = this.payload;
		const updates = {
			[`termComponents/${termComponentID}`]: null,
		};
		// delete as child of parent-terms
		for (const parentTermID of this.oldData.parentTerms.VKeys(true)) {
			updates[`terms/${parentTermID}/.components/.${termComponentID}`] = null;
		}
		return updates;
	}
}

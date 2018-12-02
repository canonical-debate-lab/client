import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Server/Server';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { TermComponent } from '../../Store/firebase/termComponents/@TermComponent';
import { Command } from '../Command';

@UserEdit
export class AddTermComponent extends Command<{termID: number, termComponent: TermComponent}, {}> {
	/* Validate_Early() {
		//Assert(termComponent.termParents && termComponent.termParents.VKeys().length == 1, `Term-component must have exactly one term-parent`);
	} */

	termComponentID: number;
	async Prepare() {
		const { termID, termComponent } = this.payload;
		const firebase = store.firebase.helpers;

		const lastTermComponentID = await GetDataAsync('general', 'data', '.lastTermComponentID') as number;
		this.termComponentID = lastTermComponentID + 1;

		termComponent.parentTerms = { [termID]: true };
	}
	async Validate() {
		const { termID, termComponent } = this.payload;
		AssertValidate('TermComponent', termComponent, 'Term-component invalid');
	}

	GetDBUpdates() {
		const { termID, termComponent } = this.payload;
		const updates = {
			'general/data/.lastTermComponentID': this.termComponentID,
			[`terms/${termID}/.components/.${this.termComponentID}`]: true,
			[`termComponents/${this.termComponentID}`]: termComponent,
		};
		return updates;
	}
}

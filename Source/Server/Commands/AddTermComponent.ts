import { UserEdit } from 'Server/CommandMacros';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import {Command} from 'mobx-firelink';
import {AssertValidate} from 'Utils/FrameworkOverrides';
import {TermComponent} from '../../Store/firebase/termComponents/@TermComponent';

@UserEdit
export class AddTermComponent extends Command<{termID: string, termComponent: TermComponent}, {}> {
	/* Validate_Early() {
		//Assert(termComponent.termParents && termComponent.termParents.VKeys().length == 1, `Term-component must have exactly one term-parent`);
	} */

	termComponentID: string;
	async Prepare() {
		const { termID, termComponent } = this.payload;

		this.termComponentID = GenerateUUID();

		termComponent.parentTerms = { [termID]: true };
	}
	async Validate() {
		const { termID, termComponent } = this.payload;
		AssertValidate('TermComponent', termComponent, 'Term-component invalid');
	}

	GetDBUpdates() {
		const { termID, termComponent } = this.payload;
		const updates = {
			// 'general/data/.lastTermComponentID': this.termComponentID,
			[`terms/${termID}/.components/.${this.termComponentID}`]: true,
			[`termComponents/${this.termComponentID}`]: termComponent,
		};
		return updates;
	}
}

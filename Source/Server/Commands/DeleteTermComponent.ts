import { UserEdit } from 'Server/CommandMacros';
import { Assert, IsNumber } from 'js-vextensions';
import { GetDataAsync , Command } from 'Utils/FrameworkOverrides';

import { TermComponent } from '../../Store_Old/firebase/termComponents/@TermComponent';

@UserEdit
export class DeleteTermComponent extends Command<{termComponentID: string}, {}> {
	Validate_Early() {
		const { termComponentID } = this.payload;
		Assert(IsNumber(termComponentID));
	}

	oldData: TermComponent;
	async Prepare() {
		const { termComponentID } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'termComponents', termComponentID) as TermComponent;
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

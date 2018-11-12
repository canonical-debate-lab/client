import { UserEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { TermComponent } from '../../Store/firebase/termComponents/@TermComponent';
import { Command } from '../Command';

@UserEdit
export class DeleteTermComponent extends Command<{termComponentID: number}, {}> {
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
			updates[`terms/${parentTermID}/components/${termComponentID}`] = null;
		}
		return updates;
	}
}
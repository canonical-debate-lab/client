import { Assert } from 'js-vextensions';
import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate, Command, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Term } from '../../Store_Old/firebase/terms/@Term';

@UserEdit
export class UpdateTermData extends Command<{termID: string, updates: Partial<Term>}, {}> {
	Validate_Early() {
		const { termID, updates } = this.payload;
		const allowedPropUpdates = ['name', 'disambiguation', 'type', 'person', 'shortDescription_current'];
		Assert(updates.VKeys().Except(...allowedPropUpdates).length == 0, `Cannot use this command to update props other than: ${allowedPropUpdates.join(', ')}`);
	}

	oldData: Term;
	newData: Term;
	async Prepare() {
		const { termID, updates } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'terms', termID) as Term;
		this.newData = { ...this.oldData, ...updates };
	}
	async Validate() {
		AssertValidate('Term', this.newData, 'New-data invalid');
	}

	GetDBUpdates() {
		const { termID } = this.payload;

		const updates = {
			[`terms/${termID}`]: this.newData,
		} as any;
		if (this.newData.name != this.oldData.name) {
			updates[`termNames/${this.oldData.name.toLowerCase()}/.${termID}`] = null;
			updates[`termNames/${this.newData.name.toLowerCase()}/.${termID}`] = true;
		}
		return updates;
	}
}

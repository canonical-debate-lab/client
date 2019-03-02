import { UserEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import { AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { TermComponent } from '../../Store/firebase/termComponents/@TermComponent';
import { Command } from '../Command';

@UserEdit
export class UpdateTermComponentData extends Command<{termComponentID: number, updates: Partial<TermComponent>}, {}> {
	Validate_Early() {
		const { termComponentID, updates } = this.payload;
		const allowedPropUpdates = ['text'];
		Assert(updates.VKeys().Except(...allowedPropUpdates).length == 0, `Cannot use this command to update props other than: ${allowedPropUpdates.join(', ')}`);
	}

	newData: TermComponent;
	async Prepare() {
		const { termComponentID, updates } = this.payload;
		const oldData = await GetDataAsync({ addHelpers: false }, 'termComponents', termComponentID) as TermComponent;
		this.newData = { ...oldData, ...updates };
	}
	async Validate() {
		AssertValidate('TermComponent', this.newData, 'New-data invalid');
	}

	GetDBUpdates() {
		const { termComponentID } = this.payload;
		const updates = {
			[`termComponents/${termComponentID}`]: this.newData,
		};
		return updates;
	}
}

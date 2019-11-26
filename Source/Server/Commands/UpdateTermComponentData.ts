import { UserEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import { AssertValidate } from 'Utils/FrameworkOverrides';

import { Command } from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';
import {GetTermComponent} from 'Store/firebase/termComponents';
import { TermComponent } from '../../Store/firebase/termComponents/@TermComponent';


@UserEdit
export class UpdateTermComponentData extends Command<{termComponentID: string, updates: Partial<TermComponent>}, {}> {
	Validate_Early() {
		const { termComponentID, updates } = this.payload;
		const allowedPropUpdates = ['text'];
		Assert(updates.VKeys().Except(...allowedPropUpdates).length == 0, `Cannot use this command to update props other than: ${allowedPropUpdates.join(', ')}`);
	}

	newData: TermComponent;
	async Prepare() {
		const { termComponentID, updates } = this.payload;
		const oldData = await GetAsync(() => GetTermComponent(termComponentID));
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

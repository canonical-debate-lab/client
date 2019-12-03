import { Assert } from 'js-vextensions';
import { Command, GetAsync } from 'mobx-firelink';
import { UserEdit } from 'Server/CommandMacros';
import { GetImage } from 'Store/firebase/images';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import { Image } from '../../Store/firebase/images/@Image';

export const UpdateImageData_allowedPropUpdates = ['name', 'type', 'url', 'description', 'previewWidth', 'sourceChains'];
@UserEdit
export class UpdateImageData extends Command<{id: string, updates: Partial<Image>}, {}> {
	Validate_Early() {
		const { id, updates } = this.payload;
		Assert(updates.VKeys().Except(...UpdateImageData_allowedPropUpdates).length == 0,
			`Cannot use this command to update props other than: ${UpdateImageData_allowedPropUpdates.join(', ')}`);
	}

	oldData: Image;
	newData: Image;
	async Prepare() {
		const { id, updates } = this.payload;
		this.oldData = await GetAsync(() => GetImage(id));
		this.newData = { ...this.oldData, ...updates };
	}
	async Validate() {
		AssertValidate('Image', this.newData, 'New-data invalid');
	}

	GetDBUpdates() {
		const { id } = this.payload;

		const updates = {
			[`images/${id}`]: this.newData,
		} as any;
		return updates;
	}
}

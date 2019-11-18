import { UserEdit } from 'Server/CommandMacros';
import { Command, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Image } from '../../Store_Old/firebase/images/@Image';

@UserEdit
export class DeleteImage extends Command<{id: string}, {}> {
	oldData: Image;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'images', id) as Image;
	}
	async Validate() {
	}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {
			[`images/${id}`]: null,
		};
		return updates;
	}
}

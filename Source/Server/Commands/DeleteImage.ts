import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Image } from '../../Store/firebase/images/@Image';
import { Command } from '../Command';

@UserEdit
export class DeleteImage extends Command<{id: number}, {}> {
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

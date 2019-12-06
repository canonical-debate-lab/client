import { UserEdit } from 'Server/CommandMacros';
import { Command, GetAsync } from 'mobx-firelink';
import {GetImage} from 'Store/firebase/images';
import { Image } from '../../Store/firebase/images/@Image';

@UserEdit
export class DeleteImage extends Command<{id: string}, {}> {
	oldData: Image;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetAsync(() => GetImage(id));
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

import { UserEdit } from 'Server/CommandMacros';
import { Command, GetDoc_Async } from 'mobx-firelink';
import { Image } from '../../Store/firebase/images/@Image';

@UserEdit
export class DeleteImage extends Command<{id: string}, {}> {
	oldData: Image;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDoc_Async({}, (a) => a.images.get(id)) as Image;
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

import { UserEdit } from 'Server/CommandMacros';
import { Image } from '../../Store/firebase/images/@Image';
import {Command} from 'mobx-firelink';
import {GetDoc_Async} from 'Utils/LibIntegrations/MobXFirelink';

@UserEdit
export class DeleteImage extends Command<{id: string}, {}> {
	oldData: Image;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDoc_Async(a=>a.images.get(id)) as Image;
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

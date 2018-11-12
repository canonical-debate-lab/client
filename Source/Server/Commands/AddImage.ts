import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Image } from '../../Store/firebase/images/@Image';
import { Command } from '../Command';

@UserEdit
export class AddImage extends Command<{image: Image}, {}> {
	imageID: number;
	async Prepare() {
		const lastImageID = await GetDataAsync('general', 'lastImageID') as number;
		this.imageID = lastImageID + 1;
		this.payload.image.createdAt = Date.now();
	}
	async Validate() {
		const { image } = this.payload;
		AssertValidate('Image', image, 'Image invalid');
	}

	GetDBUpdates() {
		const { image } = this.payload;
		const updates = {
			'general/lastImageID': this.imageID,
			[`images/${this.imageID}`]: image,
		};
		return updates;
	}
}
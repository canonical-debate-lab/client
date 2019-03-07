import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { Image } from '../../Store/firebase/images/@Image';
import { Command } from 'Utils/FrameworkOverrides';

@UserEdit
export class AddImage extends Command<{image: Image}, {}> {
	imageID: number;
	async Prepare() {
		const lastImageID = await GetDataAsync('general', 'data', '.lastImageID') as number;
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
			'general/data/.lastImageID': this.imageID,
			[`images/${this.imageID}`]: image,
		};
		return updates;
	}
}

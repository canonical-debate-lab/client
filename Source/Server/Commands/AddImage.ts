import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import { GetDataAsync } from 'Utils/FrameworkOverrides';
import { Command } from 'Utils/FrameworkOverrides';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { Image } from '../../Store/firebase/images/@Image';

@UserEdit
export class AddImage extends Command<{image: Image}, {}> {
	imageID: string;
	async Prepare() {
		this.imageID = GenerateUUID();
		this.payload.image.createdAt = Date.now();
	}
	async Validate() {
		const { image } = this.payload;
		AssertValidate('Image', image, 'Image invalid');
	}

	GetDBUpdates() {
		const { image } = this.payload;
		const updates = {
			// 'general/data/.lastImageID': this.imageID,
			[`images/${this.imageID}`]: image,
		};
		return updates;
	}
}

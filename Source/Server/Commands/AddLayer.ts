import { UserEdit } from 'Server/CommandMacros';
import { Layer } from 'Store/firebase/layers/@Layer';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import { GetDataAsync } from 'Utils/FrameworkOverrides';
import { Command } from 'Utils/FrameworkOverrides';
import { GenerateUUID } from 'Utils/General/KeyGenerator';

@UserEdit
export class AddLayer extends Command<{layer: Layer}, {}> {
	layerID: string;
	async Prepare() {
		const { layer } = this.payload;

		this.layerID = GenerateUUID();
		layer.createdAt = Date.now();
	}
	async Validate() {
		const { layer } = this.payload;
		AssertValidate('Layer', layer, 'Layer invalid');
	}

	GetDBUpdates() {
		const { layer } = this.payload;
		const updates = {
			// 'general/data/.lastLayerID': this.layerID,
			[`layers/${this.layerID}`]: layer,
		} as any;
		return updates;
	}
}

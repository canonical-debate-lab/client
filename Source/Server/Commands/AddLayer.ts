import { UserEdit } from 'Server/CommandMacros';
import { Layer } from 'Store/firebase/layers/@Layer';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { Command } from 'Utils/FrameworkOverrides';

@UserEdit
export class AddLayer extends Command<{layer: Layer}, {}> {
	layerID: number;
	async Prepare() {
		const { layer } = this.payload;

		const lastLayerID = await GetDataAsync('general', 'data', '.lastLayerID') as number;
		this.layerID = lastLayerID + 1;
		layer.createdAt = Date.now();
	}
	async Validate() {
		const { layer } = this.payload;
		AssertValidate('Layer', layer, 'Layer invalid');
	}

	GetDBUpdates() {
		const { layer } = this.payload;
		const updates = {
			'general/data/.lastLayerID': this.layerID,
			[`layers/${this.layerID}`]: layer,
		} as any;
		return updates;
	}
}

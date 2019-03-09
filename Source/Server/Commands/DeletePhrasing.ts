import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from 'Utils/FrameworkOverrides';
import { Command } from 'Utils/FrameworkOverrides';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';

@UserEdit
export class DeletePhrasing extends Command<{id: string}, {}> {
	oldData: MapNodePhrasing;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'nodePhrasings', id) as MapNodePhrasing;
	}
	async Validate() {}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {
			[`nodePhrasings/${id}`]: null,
		};
		return updates;
	}
}

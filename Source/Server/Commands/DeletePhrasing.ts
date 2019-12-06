import { Command, GetAsync } from 'mobx-firelink';
import { UserEdit } from 'Server/CommandMacros';
import { GetNodePhrasing } from 'Store/firebase/nodePhrasings';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';

@UserEdit
export class DeletePhrasing extends Command<{id: string}, {}> {
	oldData: MapNodePhrasing;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetAsync(() => GetNodePhrasing(id));
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

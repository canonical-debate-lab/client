import { UserEdit } from 'Server/CommandMacros';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { Command, GetDoc_Async } from 'mobx-firelink';

@UserEdit
export class DeletePhrasing extends Command<{id: string}, {}> {
	oldData: MapNodePhrasing;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDoc_Async({}, (a) => a.nodePhrasings.get(id));
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

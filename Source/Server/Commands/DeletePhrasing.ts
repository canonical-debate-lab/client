import { UserEdit } from 'Server/CommandMacros';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { Command } from 'mobx-firelink';
import { GetDoc_Async } from 'Utils/LibIntegrations/MobXFirelink';

@UserEdit
export class DeletePhrasing extends Command<{id: string}, {}> {
	oldData: MapNodePhrasing;
	async Prepare() {
		const { id } = this.payload;
		this.oldData = await GetDoc_Async((a) => a.nodePhrasings.get(id));
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

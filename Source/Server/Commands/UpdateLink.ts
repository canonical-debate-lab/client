import { GetNode } from 'Store/firebase/nodes';
import { AddSchema, AssertValidate, Command, GetAsync_Raw, GetSchemaJSON, WaitTillSchemaAddedThenRun } from 'Utils/FrameworkOverrides';
import { GetLinkUnderParent } from '../../Store/firebase/nodes/$node';
import { ChildEntry } from '../../Store/firebase/nodes/@MapNode';
import { UserEdit } from '../CommandMacros';

WaitTillSchemaAddedThenRun('ChildEntry', () => {
	AddSchema({
		properties: {
			linkParentID: { type: 'number' },
			linkChildID: { type: 'number' },
			linkUpdates: GetSchemaJSON('ChildEntry').Including('form', 'polarity'),
		},
		required: ['linkParentID', 'linkChildID', 'linkUpdates'],
	}, 'UpdateLink_payload');
});

@UserEdit
export class UpdateLink extends Command<{linkParentID: number, linkChildID: number, linkUpdates: Partial<ChildEntry>}, {}> {
	Validate_Early() {
		AssertValidate('UpdateLink_payload', this.payload, 'Payload invalid');
	}

	newData: ChildEntry;
	async Prepare() {
		const { linkParentID, linkChildID, linkUpdates } = this.payload;
		const parent = await GetAsync_Raw(() => GetNode(linkParentID));
		const oldData = GetLinkUnderParent(linkChildID, parent);
		this.newData = { ...oldData, ...linkUpdates };
	}
	async Validate() {
		AssertValidate('ChildEntry', this.newData, 'New link-data invalid');
	}

	GetDBUpdates() {
		const { linkParentID, linkChildID } = this.payload;
		const updates = {};
		updates[`nodes/${linkParentID}/.children/.${linkChildID}`] = this.newData;
		return updates;
	}
}

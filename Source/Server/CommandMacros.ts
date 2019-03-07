import { GetDataAsync, MergeDBUpdates } from 'Utils/FrameworkOverrides';

export function MapEdit(target: Function) {
	const oldPrepare = target.prototype.Prepare;
	target.prototype.Prepare = async function () {
		await oldPrepare.apply(this);
		if (this.payload.mapID && this.payload.mapID > 0) {
			this.map_oldEditCount = await GetDataAsync({ addHelpers: false }, 'maps', this.payload.mapID, '.edits') as number || 0;
		}
	};

	const oldGetDBUpdates = target.prototype.GetDBUpdates;
	target.prototype.GetDBUpdates = function () {
		const updates = oldGetDBUpdates.apply(this);
		const newUpdates = {};
		if (this.payload.mapID && this.payload.mapID > 0) {
			newUpdates[`maps/${this.payload.mapID}/.edits`] = this.map_oldEditCount + 1;
			newUpdates[`maps/${this.payload.mapID}/.editedAt`] = Date.now();
		}
		return MergeDBUpdates(updates, newUpdates);
	};
}

export function UserEdit(target: Function) {
	const oldPrepare = target.prototype.Prepare;
	target.prototype.Prepare = async function () {
		await oldPrepare.apply(this);
		this.user_oldEditCount = await GetDataAsync({ addHelpers: false }, 'userExtras', this.userInfo.id, '.edits') as number || 0;
	};

	const oldGetDBUpdates = target.prototype.GetDBUpdates;
	target.prototype.GetDBUpdates = function () {
		const updates = oldGetDBUpdates.apply(this);
		const newUpdates = {};
		newUpdates[`userExtras/${this.userInfo.id}/.edits`] = this.user_oldEditCount + 1;
		newUpdates[`userExtras/${this.userInfo.id}/.lastEditAt`] = Date.now();
		return MergeDBUpdates(updates, newUpdates);
	};
}

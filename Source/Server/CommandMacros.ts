import { MergeDBUpdates, GetDoc_Async } from 'mobx-firelink';

export function MapEdit(target: Function) {
	const oldPrepare = target.prototype.Prepare;
	target.prototype.Prepare = async function () {
		await oldPrepare.apply(this);
		if (this.payload.mapID) {
			this.map_oldEditCount = (await GetDoc_Async({}, (a) => a.maps.get(this.payload.mapID)))?.edits ?? 0;
		}
	};

	const oldGetDBUpdates = target.prototype.GetDBUpdates;
	target.prototype.GetDBUpdates = function () {
		const updates = oldGetDBUpdates.apply(this);
		const newUpdates = {};
		if (this.payload.mapID) {
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
		this.user_oldEditCount = (await GetDoc_Async({}, (a) => a.userExtras.get(this.userInfo.id)))?.edits ?? 0;
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

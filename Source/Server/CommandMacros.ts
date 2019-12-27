import { MergeDBUpdates, GetAsync, GetDoc } from 'mobx-firelink';
import { GetMap } from 'Store/firebase/maps';
import { GetUserExtraInfo } from 'Store/firebase/users';
import { IsString, IsFunction } from 'js-vextensions';

export function MapEdit(targetClass: Function);
export function MapEdit(mapIDKey: string);
export function MapEdit(...args) {
	let mapIDKey = 'mapID';
	if (IsFunction(args[0])) {
		ApplyToClass(args[0]);
	} else {
		mapIDKey = args[0];
		return ApplyToClass;
	}

	function ApplyToClass(targetClass: Function) {
		const oldStartValidate = targetClass.prototype.StartValidate;
		targetClass.prototype.StartValidate = function () {
			const result = oldStartValidate.apply(this);
			const mapID = this.payload[mapIDKey];
			if (mapID) {
				const map = GetMap(mapID);
				if (map != null) {
					this.map_oldEditCount = map.edits ?? 0;
				}
			}
			return result;
		};

		const oldGetDBUpdates = targetClass.prototype.GetDBUpdates;
		targetClass.prototype.GetDBUpdates = function () {
			const updates = oldGetDBUpdates.apply(this);
			const newUpdates = {};
			if (this.map_oldEditCount != null) {
				const mapID = this.payload[mapIDKey];
				if (mapID) {
					newUpdates[`maps/${mapID}/.edits`] = this.map_oldEditCount + 1;
					newUpdates[`maps/${mapID}/.editedAt`] = Date.now();
				}
			}
			return MergeDBUpdates(updates, newUpdates);
		};
	}
}

export function UserEdit(target: Function) {
	const oldPrepare = target.prototype.Prepare;
	target.prototype.Prepare = async function () {
		await oldPrepare.apply(this);
		this.user_oldEditCount = (await GetAsync(() => GetUserExtraInfo(this.userInfo.id)))?.edits ?? 0;
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

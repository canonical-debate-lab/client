import { FirebaseData } from 'Store/firebase';
import { GetUserID } from 'Store/firebase/users';
import u from 'updeep';
import { State } from 'Frame/Store/StoreHelpers';
import { FreezeConnectComps, UnfreezeConnectComps } from 'Frame/Database/FirebaseConnect';
import { ApplyDBUpdates, ApplyDBUpdates_Local, DBPath, RemoveHelpers } from '../Frame/Database/DatabaseHelpers';
import { AssertValidate } from './Server';

export class CommandUserInfo {
	id: string;
}

let currentCommandRun_listeners = null;
async function WaitTillCurrentCommandFinishes() {
	return new Promise((resolve, reject) => {
		currentCommandRun_listeners.push({ resolve, reject });
	});
}
function NotifyListenersThatCurrentCommandFinished() {
	const currentCommandRun_listeners_copy = currentCommandRun_listeners;
	currentCommandRun_listeners = null;
	for (const listener of currentCommandRun_listeners_copy) {
		listener.resolve();
	}
}

export abstract class Command<Payload, ReturnData> {
	static defaultPayload = {};
	constructor(payload: Payload) {
		this.userInfo = { id: GetUserID() }; // temp
		this.type = this.constructor.name;
		this.payload = E(this.constructor['defaultPayload'], payload);
		// this.Extend(payload);
		// Object.setPrototypeOf(this, Object.getPrototypeOf({}));
	}
	userInfo: CommandUserInfo;
	type: string;
	payload: Payload;
	returnData;

	// these methods are executed on the server (well, will be later)
	// ==========

	// parent commands should call MarkAsSubcommand() immediately after setting a subcommand's payload
	asSubcommand = false;
	MarkAsSubcommand() {
		this.asSubcommand = true;
		this.Validate_Early();
		return this;
	}

	/** [sync] Validates the payload data. (ie. the validation that doesn't require accessing the database) */
	Validate_Early() {}
	/** [async] Transforms the payload data, combines it with database data, and so on, in preparation for the database-updates-map construction. */
	abstract Prepare(): Promise<void>
	/** [async] Validates the prepared data, mostly using ajv shape-validation. */
	abstract Validate(): Promise<void>
	/** [sync] Retrieves the actual database updates that are to be made. (so we can do it in one atomic call) */
	abstract GetDBUpdates(): {}

	async PreRun() {
		RemoveHelpers(this.payload); // have this run locally, before sending, to save on bandwidth
		this.Validate_Early();
		await this.Prepare();
		await this.Validate();
	}
	/** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
	async Run(): Promise<ReturnData> {
		while (currentCommandRun_listeners) {
			await WaitTillCurrentCommandFinishes();
		}
		currentCommandRun_listeners = [];

		MaybeLog(a => a.commands, l => l('Running command. @type:', this.constructor.name, ' @payload(', this.payload, ')'));

		try {
			FreezeConnectComps();
			await this.PreRun();

			const dbUpdates = this.GetDBUpdates();
			await this.Validate_LateHeavy(dbUpdates);
			// FixDBUpdates(dbUpdates);
			// await store.firebase.helpers.DBRef().update(dbUpdates);
			await ApplyDBUpdates(DBPath(), dbUpdates);

			// MaybeLog(a=>a.commands, ()=>`Finishing command. @type:${this.constructor.name} @payload(${ToJSON(this.payload)}) @dbUpdates(${ToJSON(dbUpdates)})`);
			MaybeLog(a => a.commands, l => l('Finishing command. @type:', this.constructor.name, ' @command(', this, ') @dbUpdates(', dbUpdates, ')'));
		} finally {
			const areOtherCommandsBuffered = currentCommandRun_listeners.length > 0;
			NotifyListenersThatCurrentCommandFinished();
			if (!areOtherCommandsBuffered) {
				UnfreezeConnectComps();
			}
		}

		// later on (once set up on server), this will send the data back to the client, rather than return it
		return this.returnData;
	}

	// standard validation of common paths/object-types; perhaps disable in production
	async Validate_LateHeavy(dbUpdates: any) {
		// validate "nodes/X"
		/* let nodesBeingUpdated = (dbUpdates.VKeys() as string[]).map(a=> {
			let match = a.match(/^nodes\/([0-9]+).*#/);
			return match ? match[1].ToInt() : null;
		}).filter(a=>a).Distinct();
		for (let nodeID of nodesBeingUpdated) {
			let oldNodeData = await GetAsync_Raw(()=>GetNode(nodeID));
			let updatesForNode = dbUpdates.Props().filter(a=>a.name.match(`^nodes/${nodeID}($|/)`));

			let newNodeData = oldNodeData;
			for (let update of updatesForNode) {
				newNodeData = u.updateIn(update.name.replace(new RegExp(`^nodes/${nodeID}($|/)`), "").replace(/\//g, "."), u.constant(update.value), newNodeData);
			}
			if (newNodeData != null) { // (if null, means we're deleting it, which is fine)
				AssertValidate("MapNode", newNodeData, `New node-data is invalid.`);
			}
		} */

		// locally-apply db-updates, then validate the result (for now, only works for already-loaded data paths)
		const oldData = RemoveHelpers(Clone(State(`firestore/data/${DBPath()}`)));
		const newData = ApplyDBUpdates_Local(oldData, dbUpdates);
		ValidateDBData(newData);
	}
}

export function ValidateDBData(data: FirebaseData) {
	for (const map of (data.maps || {}).VValues(true)) AssertValidate('Map', map, 'Map invalid');
	for (const node of (data.nodes || {}).VValues(true)) AssertValidate('MapNode', node, 'Node invalid');
	for (const revision of (data.nodeRevisions || {}).VValues(true)) AssertValidate('MapNodeRevision', revision, 'Node-revision invalid');
	for (const termComp of (data.termComponents || {}).VValues(true)) AssertValidate('TermComponent', termComp, 'Term-component invalid');
	for (const term of (data.terms || {}).VValues(true)) AssertValidate('Term', term, 'Term invalid');
}

/* type Update = {path: string, data: any};
function FixDBUpdates(updatesMap) {
	let updates = updatesMap.Props().map(prop=>({path: prop.name, data: prop.value}));
	for (let update of updates) {
		let otherUpdatesToMergeIntoThisOne: Update[] = updates.filter(update2=> {
			return update2.path.startsWith(update.path);
		});
		for (let updateToMerge of otherUpdatesToMergeIntoThisOne) {
			delete updates[updateToMerge.path];

			let updateToMerge_relativePath = updateToMerge.path.substr(0, update.path.length);
			update.data = u.updateIn(updateToMerge_relativePath, constant(updateToMerge.data), update.data)
		}
	}
} */
type Update = {path: string, data: any};
export function MergeDBUpdates(baseUpdatesMap: Object, updatesToMergeMap: Object) {
	const baseUpdates = baseUpdatesMap.Pairs().map(pair => ({ path: pair.key, data: pair.value })) as Update[];
	const updatesToMerge = updatesToMergeMap.Pairs().map(pair => ({ path: pair.key, data: pair.value })) as Update[];

	for (const update of updatesToMerge) {
		Assert(!(update.data instanceof Command), 'You forgot to add the GetDBUpdates() method-call, ie: sub.GetDBUpdates().');
		// if an update-to-merge exists for a path, remove any base-updates starting with that path (since the to-merge ones have priority)
		if (update.data == null) {
			for (const update2 of baseUpdates.slice()) { // make copy, since Remove() seems to break iteration otherwise
				if (update2.path.startsWith(update.path)) {
					baseUpdates.Remove(update2);
				}
			}
		}
	}

	const finalUpdates = [] as Update[];
	for (const update of baseUpdates) {
		// find updates-to-merge where a field under this path is updated (collection-updates under this path are left alone since they're supposed to be separate updates)
		const updatesToMergeIntoThisOne: Update[] = updatesToMerge.filter(update2 => update2.path.startsWith(`${update.path}/.`));
		for (const updateToMerge of updatesToMergeIntoThisOne) {
			const updateToMerge_relativePath = updateToMerge.path.substr(`${update.path}/`.length);

			// if (updateToMerge.data) {
			// assume that the update-to-merge has priority, so have it completely overwrite the data at its path
			update.data = u.updateIn(updateToMerge_relativePath.replace(/\//g, '.'), u.constant(updateToMerge.data), update.data);
			/* } else {
				update.data = null;
			} */

			// remove from updates-to-merge list (since we just merged it)
			updatesToMerge.Remove(updateToMerge);
		}

		finalUpdates.push(update);
	}

	// for any "update to merge" which couldn't be merged into one of the base-updates, just add it as its own update (it won't clash with the others)
	for (const update of updatesToMerge) {
		finalUpdates.push(update);
	}

	const finalUpdatesMap = finalUpdates.reduce((result, current) => result.VSet(current.path, current.data), {});
	return finalUpdatesMap;
}

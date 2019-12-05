import { E, SleepAsync, Assert, Clone, DeepSet } from 'js-vextensions';
import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { HasAdminPermissions } from 'Store/firebase/userExtras';
import { Omit } from 'lodash';
import { PageContainer } from 'Utils/FrameworkOverrides';
import { dbVersion } from 'Main';
import { ValidateDBData } from 'Utils/Store/DBDataValidator';
import { store, RootState } from 'Store';
import { ConvertDataToValidDBUpdates, ApplyDBUpdates_InChunks, DBPath, SplitStringBySlash_Cached, GetDoc_Async, GetDocs_Async, WithStore, GetDoc } from 'mobx-firelink';
import {FirebaseDBShape} from 'Store/firebase';
import { styles } from '../../Utils/UI/GlobalStyles';
import { MeID, GetUser } from '../../Store/firebase/users';
import { ResetCurrentDBRoot } from './Admin/ResetCurrentDBRoot';

type UpgradeFunc = (oldData: FirebaseDBShape, markProgress: MarkProgressFunc)=>Promise<FirebaseDBShape>;
type MarkProgressFunc = (depth: number, entryIndex: number, entryCount?: number)=>void;

// upgrade-funcs
const upgradeFuncs = {} as any; // populated by modules below
export function AddUpgradeFunc(version: number, func: UpgradeFunc) {
	upgradeFuncs[version] = func;
}
// require("./Admin/DBUpgrades/UpgradeDB_2");
// require("./Admin/DBUpgrades/UpgradeDB_3");
// require("./Admin/DBUpgrades/UpgradeDB_4");
// require("./Admin/DBUpgrades/UpgradeDB_5");
// require("./Admin/DBUpgrades/UpgradeDB_6");
// require("./Admin/DBUpgrades/UpgradeDB_7");
// require("./Admin/DBUpgrades/UpgradeDB_8");
// require("./Admin/DBUpgrades/UpgradeDB_9");
// require('./Admin/DBUpgrades/UpgradeDB_10');
// require('./Admin/DBUpgrades/UpgradeDB_11');
require('./Admin/DBUpgrades/UpgradeDB_12');

export class AdminUI extends BaseComponentPlus({} as {}, { dbUpgrade_entryIndexes: [] as number[], dbUpgrade_entryCounts: [] as number[] }) {
	/* constructor(props) {
		super(props);
		//this.state = {env: envSuffix};
		this.SetEnvironment(envSuffix);
	}
	SetEnvironment(env: string) {
		var {version, firebaseConfig} = require(env == "production" ? "../../BakedConfig_Prod" : "../../BakedConfig_Dev");
		try {
			Firebase.initializeApp(firebaseConfig);
		} catch (err) {} // silence reinitialize warning (hot-reloading)
      Firebase.database.enableLogging(true);
		const rootRef = (Firebase as any).database().ref();
		this.SetState({fb: rootRef, env});
	} */

	render() {
		const { dbUpgrade_entryIndexes, dbUpgrade_entryCounts } = this.state;
		const isAdmin = HasAdminPermissions(MeID())
			// also check previous version for admin-rights (so we can increment db-version without losing our rights to complete the db-upgrade!)
			|| (MeID() != null && GetDoc({}, (a: any) => (a.versions.get(`v${dbVersion - 1}-${DB_SHORT}`) as FirebaseDBShape).userExtras.get(MeID()))?.permissionGroups.admin, { inVersionRoot: false });

		if (!isAdmin) return <PageContainer>Please sign in.</PageContainer>;
		return (
			<PageContainer scrollable={true}>
				<Row m="-10px 0"><h2>Database</h2></Row>
				{/* <Row>
					<Pre>Environment: </Pre><Select options={["dev", "prod"]} value={this.state.env} onChange={val=>this.SetEnvironment(val)}/>
				</Row> */}
				<Row><h4>General</h4></Row>
				<Row>
					<Button text={`Reset ${DBPath({})}`} onClick={() => {
						ShowMessageBox({
							title: `Reset ${DBPath({})}?`,
							message: 'This will clear all existing data in this root, then replace it with a fresh, initial state.', cancelButton: true,
							onOK: () => {
								ResetCurrentDBRoot();
							},
						});
					}}/>
				</Row>
				<Row mt={5}><h4>Upgrader</h4></Row>
				<Column style={{ alignItems: 'flex-start' }}>
					{upgradeFuncs.Pairs().map((pair) => <UpgradeButton key={pair.key} newVersion={pair.keyNum} upgradeFunc={pair.value} markProgress={this.MarkProgress.bind(this)}/>)}
				</Column>
				{dbUpgrade_entryIndexes.length > 0 &&
					<Row>
						<span>Progress: </span>
						{dbUpgrade_entryIndexes.map((entryIndex, depth) => <span key={depth}>{depth > 0 ? ' -> ' : ''}{entryIndex + 1}/{dbUpgrade_entryCounts[depth]}</span>)}
					</Row>}
				<Row><h4>Testing</h4></Row>
				<Row>
					<Button text={'Throw async error'} onClick={async () => {
						await SleepAsync(1000);
						throw new Error('Oh no!');
					}}/>
				</Row>

				{/* <Row m="-10px 0"><h2>Storage</h2></Row>
				<Row><h4>Backgound images</h4></Row>
				<Row>
					<Button text={'Create missing thumnails'} onClick={() => {
						ShowMessageBox({
							title: 'Create missing thumbnails?',
							message: 'This could take some time.', cancelButton: true,
							onOK: () => {
								CreateMissingThumbnails();
							},
						});
					}}/>
				</Row> */}
			</PageContainer>
		);
	}

	async MarkProgress(depth: number, entryIndex: number, entryCount?: number) {
		let { dbUpgrade_entryIndexes, dbUpgrade_entryCounts } = this.state;
		[dbUpgrade_entryIndexes, dbUpgrade_entryCounts] = [dbUpgrade_entryIndexes.slice(), dbUpgrade_entryCounts.slice()]; // use copies of arrays

		dbUpgrade_entryIndexes[depth] = entryIndex;
		if (entryCount != null) {
			dbUpgrade_entryCounts[depth] = entryCount;
		}
		this.SetState({ dbUpgrade_entryIndexes, dbUpgrade_entryCounts });

		// every 100 entries, wait a bit, so UI can update
		if (entryIndex % 100 == 0) {
			await SleepAsync(10);
		}
	}
}

// Note that, when you change the dbRootVersion, you'll lose admin privileges.
// So to use the Upgrade button, you'll first need to manually set yourself as admin, in the new db-root (using the Firebase Database page).
export class UpgradeButton extends BaseComponent<{newVersion: number, upgradeFunc: UpgradeFunc, markProgress: MarkProgressFunc}, {}> {
	render() {
		const { newVersion, upgradeFunc, markProgress } = this.props;

		const oldVersionName = `v${newVersion - 1}-${DB_SHORT}`;
		const oldVersionPath = `versions/${oldVersionName}`;
		const newVersionName = `v${newVersion}-${DB_SHORT}`;
		const newVersionPath = `versions/${newVersionName}`;

		return (
			<Button text={`${oldVersionName}   ->   ${newVersionName}`} style={{ whiteSpace: 'pre' }} onClick={() => {
				ShowMessageBox({
					title: `Upgrade ${oldVersionName}   ->   ${newVersionName}?`,
					message:
`The new db-root (${newVersionName}) will be created as a transformation of the old db-root (${oldVersionName}).
					
The old db-root will not be modified.`,
					cancelButton: true,
					onOK: async () => {
						// const oldData = await GetDataAsync({ inVersionRoot: false }, ...oldVersionPath.split('/')) as FirebaseData;
						const oldData = await GetCollectionsDataAsync(oldVersionPath);

						// maybe temp; use firebase-data overriding system, so upgrade-funcs can use GetData() and such -- but accessing a local data-store (which can be updated) instead of the "real" remote data
						const newStore = Clone(store);
						DeepSet(newStore, `firebase/data/${DBPath({})}`, oldData);
						const newData = await WithStore(newStore, () => {
							return upgradeFunc(oldData, markProgress);
						});
						// RemoveHelpers(newData); // remove "_key" and such

						if (newVersion >= dbVersion) {
							ValidateDBData(newData);
						}

						/* const firebase = store.firebase.helpers;
						await firebase.ref(DBPath(`${newVersionPath}/`, false)).set(newData); */

						await ImportCollectionsData(newVersionPath, newData);

						ShowMessageBox({
							title: `Upgraded: ${oldVersionName}   ->   ${newVersionName}`,
							message: 'Done!',
						});
					},
				});
			}}/>
		);
	}
}

function AssertVersionRootPath(path: string) {
	const parts = SplitStringBySlash_Cached(path);
	Assert(parts.length == 2, 'Version-root path must have exactly two segments.');
	Assert(parts[0] == 'versions', 'Version-root path\'s first segment must be "versions".');
	Assert(parts[1].match('v[0-9]+-(dev|prod)'), 'Version-root path\'s second segment must match "v10-dev" pattern.');
}

/* type WithDifferentValueType<T, NewValueType> = { [P in keyof T]-?: NewValueType; };
type FirebaseData_AnyValues = WithDifferentValueType<FirebaseData, any>; */

/** Note that this does not capture subcollections (eg. maps/1/nodeEditTimes). Currently not an issue since we aren't using subcollections. (ie. collections stored under a document's path) */
export async function GetCollectionsDataAsync(versionRootPath: string) {
	AssertVersionRootPath(versionRootPath);

	async function getDocs(...collectionSubpath: string[]) {
		return GetDocs_Async({ inVersionRoot: false }, [...SplitStringBySlash_Cached(versionRootPath), ...collectionSubpath]) as any;
	}
	async function getDoc(...collectionSubpath: string[]) {
		return GetDoc_Async({ inVersionRoot: false }, [...SplitStringBySlash_Cached(versionRootPath), ...collectionSubpath]) as any;
	}

	let versionCollectionsData: FirebaseDBShape;
	// we put the db-updates into this variable, so that we know we're importing data for every key (if not, Typescript throws error about value not matching FirebaseData's shape)
	versionCollectionsData = {
		// modules
		/* 'modules/feedback/general': await getDocs('modules', 'feedback', 'general'),
		'modules/feedback/proposals': await getDocs('modules', 'feedback', 'proposals'),
		'modules/feedback/userData': await getDocs('modules', 'feedback', 'userData'), */
		modules: {
			feedback: await getDoc('modules', 'feedback'),
		},

		general: await getDocs('general'),
		images: await getDocs('images'),
		layers: await getDocs('layers'),
		maps: await getDocs('maps'),
		mapNodeEditTimes: await getDocs('mapNodeEditTimes'),
		nodes: await getDocs('nodes'),
		// nodeExtras: await getDocs('nodeExtras'),
		nodePhrasings: await getDocs('nodePhrasings'),
		nodeRatings: await getDocs('nodeRatings'),
		nodeRevisions: await getDocs('nodeRevisions'),
		// nodeStats: await getDocs('nodeStats'),
		// nodeViewers: await getDocs('nodeViewers'),
		terms: await getDocs('terms'),
		termComponents: await getDocs('termComponents'),
		termNames: await getDocs('termNames'),
		timelines: await getDocs('timelines'),
		timelineSteps: await getDocs('timelineSteps'),
		users: await getDocs('users'),
		userExtras: await getDocs('userExtras'),
		userMapInfo: await getDocs('userMapInfo'),
		// userViewedNodes: await getDocs('userViewedNodes'),
	};

	return versionCollectionsData;
}

export async function ImportCollectionsData(versionRootPath: string, collectionsDataToImport: any) {
	AssertVersionRootPath(versionRootPath);
	// ApplyDBUpdates(DBPath(), ConvertDataToValidDBUpdates(DBPath(), data));

	/* let dataAsUpdates: FirebaseData_AnyValues;
	// we put the db-updates into this dataAsUpdates variable, so that we know we're importing data for every key (if not, Typescript throws error about value not matching FirebaseData's shape)
	dataAsUpdates = {
		forum: ConvertToDBUpdates('forum'),
	}; */

	const allDBUpdates = {}; // relative to root-path
	for (const key of collectionsDataToImport.VKeys(true)) {
		const dbUpdates = ConvertDataToValidDBUpdates(versionRootPath, { [key]: collectionsDataToImport[key] });
		allDBUpdates.Extend(dbUpdates);
	}

	Log('Importing db-data into path. Path: ', versionRootPath, ' DBData: ', collectionsDataToImport, ' DBUpdates: ', allDBUpdates);
	await ApplyDBUpdates_InChunks({}, versionRootPath, allDBUpdates);
}

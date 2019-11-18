import { ShowMessageBox } from 'react-vmessagebox';
import { MapNodeRevision } from 'Store_Old/firebase/nodes/@MapNodeRevision';
import { MeID } from 'Store_Old/firebase/users';
import { ApplyDBUpdates, DBPath, ConvertDataToValidDBUpdates } from 'Utils/FrameworkOverrides';
import { ValidateDBData } from 'Utils/Store/DBDataValidator';
import {GenerateUUID} from 'Utils/General/KeyGenerator';
import { FirebaseData } from '../../../Store_Old/firebase';
import { Map, MapType } from '../../../Store_Old/firebase/maps/@Map';
import { MapNode, globalRootNodeID, globalMapID } from '../../../Store_Old/firebase/nodes/@MapNode';
import { MapNodeType } from '../../../Store_Old/firebase/nodes/@MapNodeType';
import { UserExtraInfo } from '../../../Store_Old/firebase/userExtras/@UserExtraInfo';

// Note: This is currently not used, and probably doesn`t even work atm.

// export default async function ResetCurrentDBRoot(database: firebase.Database) {
const sharedData = {} as {creatorInfo: any};
export async function ResetCurrentDBRoot() {
	const userKey = MeID();

	const data = {} as FirebaseData;
	data.general = {} as any;
	data.general.data = {
		lastTermID: 0,
		lastTermComponentID: 0,
		lastImageID: 0,
		lastLayerID: 0,
		lastNodeRevisionID: 0,
		lastTimelineID: 0,
		lastTimelineStepID: 0,

		// these start at 100, since 1-100 are reserved
		lastMapID: 99,
		lastNodeID: 99,
	};
	data.maps = {};
	data.nodes = {};
	data.nodeRevisions = {};
	data.userExtras = {};

	sharedData.creatorInfo = { creator: userKey, createdAt: Date.now() };

	AddUserExtras(data, userKey, new UserExtraInfo({
		joinDate: Date.now(),
		permissionGroups: { basic: true, verified: true, mod: true, admin: true },
	}));
	AddMap(data, { name: 'Global', type: MapType.Global, rootNode: globalRootNodeID } as Map, globalMapID);
	AddNode(data,
		new MapNode({ type: MapNodeType.Category }),
		new MapNodeRevision({ titles: { base: 'Root' } }),
		globalRootNodeID);

	ValidateDBData(data);

	await ApplyDBUpdates(DBPath(), ConvertDataToValidDBUpdates('', data));

	ShowMessageBox({ message: 'Done!' });
}

function AddUserExtras(data: FirebaseData, userID: string, extraInfo: UserExtraInfo) {
	data.userExtras[userID] = extraInfo;
}
function AddMap(data: FirebaseData, entry: Map, id: string) {
	entry = E(sharedData.creatorInfo, entry);

	// data.maps[id || ++data.general.data.lastMapID] = entry as any;
	data.maps[id || GenerateUUID()] = entry as any;
}
function AddNode(data: FirebaseData, node: MapNode, revision: MapNodeRevision, nodeID?: string) {
	node = E(sharedData.creatorInfo, node);
	revision = E(sharedData.creatorInfo, revision);

	nodeID = nodeID || GenerateUUID();
	const revisionID = GenerateUUID();

	node.currentRevision = revisionID;
	data.nodes[nodeID] = node as any;

	revision.node = nodeID;
	data.nodeRevisions[revisionID] = revision;
}

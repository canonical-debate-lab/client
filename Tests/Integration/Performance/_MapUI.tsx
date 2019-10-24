// eslint-disable-next-line
/// <reference types="Cypress" />

// import 'babel-core/register';
// import 'babel-polyfill';

// const { MockFirebase, MockFirestore } = require('firebase-mock');
// import { DBPath } from '../../../Source/Utils/FrameworkOverrides';
// import { DBPath } from 'vwebapp-framework/Source/index';

// If something imported has wrong typing (eg. "any" when should be specific type), it's probably due to non-relative imports failing from the Tests folder.
// To fix, make the needed imports relative. (long-term, either fix root cause, or use tsconfig to force all imports relative, so test-writers don't get confused down the road)
// declare let { DBPath }: typeof import('../../../node_modules/vwebapp-framework/Source/index');
declare const { DBPath }: typeof import('../../../Source/Utils/FrameworkOverrides');
declare const { AddMap }: typeof import('../../../Source/Server/Commands/AddMap');
declare const { Assert }: typeof import('../../../../../@Modules/react-vscrollview/Main/dist/Utils');
declare const { MeID }: typeof import('../../../Source/Store/firebase/users');
declare const { ACTPersonalMapSelect }: typeof import('../../../Source/Store/main/personal');
declare const { AddChildNode }: typeof import('../../../Source/Server/Commands/AddChildNode');
declare const { ACTMapNodeExpandedSet }: typeof import('../../../Source/Store/main/mapViews/$mapView/rootNodeViews');
declare const { ACTSetLastAcknowledgementTime }: typeof import('../../../Source/Store/main');
declare const { MapNode }: typeof import('../../../Source/Store/firebase/nodes/@MapNode');
declare const { MapNodeType }: typeof import('../../../Source/Store/firebase/nodes/@MapNodeType');
declare const { MapNodeRevision }: typeof import('../../../Source/Store/firebase/nodes/@MapNodeRevision');
declare const { ClaimForm }: typeof import('../../../Source/Store/firebase/nodes/@MapNode');
declare const { Polarity }: typeof import('../../../Source/Store/firebase/nodes/@MapNode');
declare const { AddChildHelper }: typeof import('../../../Source/UI/@Shared/Maps/MapNode/NodeUI_Menu/AddChildDialog');

declare const global;
/* declare global {
	interface Object {
		entries: any;
	}
} */
declare interface Object {
	entries: any;
}

let RR: any;
function LoadImports(source) {
	console.log('Loading imports from: ', source);
	RR = source;
	// ({ DBPath } = source);
	for (const [name, value] of Object.entries(source)) {
		if (name.match(/^[a-zA-Z_][a-zA-Z_0-9]+$/) == null) continue;
		if (name in global) continue;
		global[name] = value;
	}
	/* const varNames = { DBPath };
	eval(`{${Object.keys(varNames).join(',')}} = source`); */
}

/* function DBPath(path = '', inVersionRoot = true) {
	if (inVersionRoot) {
		// path = `versions/v12-prod${path ? `/${path}` : ''}`;
		path = `versions/v12-dev${path ? `/${path}` : ''}`;
	}
	return path;
} */
// async function SeedDB(db: firebase.firestore.Firestore) {
async function SeedDB(firebase) {
	const db = firebase.firestore();
	const auth = firebase.auth();
	console.log('Seeding DB:', db);

	const mainUser = { email: 'ben@example.com', password: 'examplePass' };
	auth.createUser(mainUser);
	// auth.login(mainUser);
	// auth.authAnonymously();
	// const profile = { email: creds.email }
	// await firebase.updateProfile(mainUser);
	const fullAuth = {
		type: '@@reactReduxFirebase/LOGIN',
		auth: {
			uid: 'GiEDg0yoYRX4XnvzbSZxZflDfHj1',
			displayName: 'Stephen Wicklund',
			photoURL: 'https://lh6.googleusercontent.com/-CeOB1puP1U8/AAAAAAAAAAI/AAAAAAAAAZA/nk51qe4EF8w/photo.jpg',
			email: 'venryx@gmail.com',
			emailVerified: true,
			isAnonymous: false,
			providerData: [
				{
					uid: '108415649882206100036',
					displayName: 'Stephen Wicklund',
					photoURL: 'https://lh3.googleusercontent.com/a-/AAuE7mBuHY2263yAPFvsItCq4w9K7vAbIfWUbd2uj-xoFA',
					email: 'venryx@gmail.com',
					phoneNumber: null,
					providerId: 'google.com',
				},
			],
		},
	};
	// Object.setPrototypeOf(fullAuth, Object.getPrototypeOf(RR.Action.prototype));
	// Object.setPrototypeOf(fullAuth, Object.getPrototypeOf({}));
	// Object.setPrototypeOf(fullAuth, Object.prototype);
	// Object.setPrototypeOf(fullAuth, RR.ObjectPrototype);
	// Object.setPrototypeOf(fullAuth, Object.getPrototypeOf(RR.emptyObj));

	// add class-extensions from site-context prototypes, to our own test-context prototypes
	Object.defineProperties(Object.getPrototypeOf({}), Object['getOwnPropertyDescriptors'](Object.getPrototypeOf(RR.emptyObj)));
	Object.defineProperties(Object.getPrototypeOf([]), Object['getOwnPropertyDescriptors'](Object.getPrototypeOf(RR.emptyArray)));

	RR.store.dispatch(fullAuth);
	Assert(MeID() != null);

	// await db.doc(DBPath('users/test1')).set({ name: 'Test1' });

	async function AddTestMap(info) {
		// if (mapID == null) mapID = `Map ${Math.random()}`;
		const map = Object.assign({}, { name: `Map ${Math.random()}`, type: 10, creator: 'MyUser' }, info);
		// db.doc(DBPath(`maps/${mapID}`)).set(map);
		const command = new AddMap({ map });
		const mapID = await command.Run();
		return { command, mapID };
	}
	const mapInfo = await AddTestMap({ name: 'MainTestMap' }); // , '---TestingMap---');
	for (let i = 0; i < 10; i++) AddTestMap({});
	Assert(mapInfo.mapID != null);
	const rootNodeID = mapInfo.command.payload.map.rootNode;

	RR.store.dispatch(new ACTPersonalMapSelect({ id: mapInfo.mapID }));

	await RR.SleepAsync(50); // wait a bit, till map-data loaded (otherwise nodes can't be expanded)

	async function AddNode(parentPath: string, type: number, title: string, polarityIfArg?: number) {
		const helper = new AddChildHelper(parentPath, type, title, polarityIfArg, fullAuth.auth.uid, mapInfo.mapID);
		return helper.Apply();
	}

	await RR.GetAsync(() => RR.GetNode(rootNodeID)); // wait until root-node is loaded into store
	const claimNodeID = (await AddNode(rootNodeID, MapNodeType.Claim, 'Claim')).nodeID;
	await RR.GetAsync(() => RR.GetNode(claimNodeID)); // wait until claim-node is loaded into store
	for (let i = 0; i < 10; i++) {
		await AddNode(`${rootNodeID}/${claimNodeID}`, MapNodeType.Argument, `Pro${i + 1}`, Polarity.Supporting);
	}
	for (let i = 0; i < 10; i++) {
		await AddNode(`${rootNodeID}/${claimNodeID}`, MapNodeType.Argument, `Con${i + 1}`, Polarity.Opposing);
	}

	// console.log('DB contents:', await collectionRef.get());
	// console.log('Seeded DB contents:', db.children);
	console.log('Seeded DB contents:', (await db.collection(DBPath()).get()).ref.children);
}

context('MapUI', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3005/personal/---TestingMap---');
		// const mfb = new MockFirebase('', '', '', '');
		// const firestoreMock = new MockFirestore('', '', '', '');

		return cy.window()
			.then((win) => {
				const timerID = setInterval(() => {
					if (win['RR'] == null) return;
					clearInterval(timerID);
					LoadImports(win['RR']);
					// console.log('Setting SeedDB');
					// win['SeedDB'] = SeedDB;
					SeedDB(win['store'].firebase);
				}, 10);
			});
	});

	// https://on.cypress.io/interacting-with-elements
	it('Record how long it takes for the speed-test map to load', () => {
		// todo
	});
});

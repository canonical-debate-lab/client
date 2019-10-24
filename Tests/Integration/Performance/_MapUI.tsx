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

declare const global;
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
	Object.setPrototypeOf(fullAuth, Object.getPrototypeOf(RR.emptyObj));
	RR.store.dispatch(fullAuth);
	Assert(MeID() != null);

	// await db.doc(DBPath('users/test1')).set({ name: 'Test1' });

	async function AddTestMap(info) {
		// if (mapID == null) mapID = `Map ${Math.random()}`;
		const map = Object.assign({}, { name: `Map ${Math.random()}`, type: 10, creator: 'MyUser' }, info);
		// db.doc(DBPath(`maps/${mapID}`)).set(map);
		return new AddMap({ map }).Run();
	}
	const mainMapID = await AddTestMap({ name: 'MainTestMap' }); // , '---TestingMap---');
	Assert(mainMapID != null);

	RR.store.dispatch(new ACTPersonalMapSelect({ id: mainMapID }));

	for (let i = 0; i < 10; i++) {
		AddTestMap({});
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

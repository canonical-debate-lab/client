// eslint-disable-next-line
/// <reference types="Cypress" />

// const { MockFirebase, MockFirestore } = require('firebase-mock');

function DBPath(path = '', inVersionRoot = true) {
	if (inVersionRoot) {
		// path = `versions/v12-prod${path ? `/${path}` : ''}`;
		path = `versions/v12-dev${path ? `/${path}` : ''}`;
	}
	return path;
}
// async function SeedDB(db: firebase.firestore.Firestore) {
async function SeedDB(db) {
	console.log('Seeding DB:', db);

	await db.doc(DBPath('users/test1')).set({ name: 'Test1' });

	function AddMap(info, mapID = null) {
		if (mapID == null) mapID = `Map ${Math.random()}`;
		const map = Object.assign({}, { name: mapID, type: 10, creator: 'MyUser' }, info);
		db.doc(DBPath(`maps/${mapID}`)).set(map);
	}
	AddMap({ name: 'MainTestMap' }, '---TestingMap---');

	for (let i = 0; i < 10; i++) {
		AddMap({});
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
				// console.log('Setting SeedDB');
				// win['SeedDB'] = SeedDB;
				SeedDB(win['firestoreDB']);
			});
	});

	// https://on.cypress.io/interacting-with-elements
	it('Record how long it takes for the speed-test map to load', () => {
		// todo
	});
});

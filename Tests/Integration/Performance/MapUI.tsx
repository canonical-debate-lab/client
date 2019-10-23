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
	db.autoFlush();

	/* const collectionRef = firebase.firestore().collection('collectionId');
	ref.doc('docId').set({foo: 'bar'});
	ref.doc('anotherDocId').set({foo: 'baz'}); */
	await db.doc(DBPath('users/test1')).set({ name: 'Test1' });
	/* const collectionRef = db.collection(DBPath("users"));
	const doc1Ref = collectionRef.doc("docId");
	await doc1Ref.set({foo: "bar"});
	await collectionRef.doc("anotherDocId").set({foo: "baz"}); */
	// db.flush();

	await db.doc(DBPath('maps/test1')).set({ name: 'Test1' });

	console.log('DB contents2:', db.children);
	// console.log('DB contents3:', await collectionRef.get());
	// db.doc(DBPath('maps/test1')).get().then(val => console.log('DB contents3:', val));

	setInterval(() => {
		const mapID = Math.random();
		const map = { name: mapID, type: 10, creator: 'MyUser' };
		console.log(`Added map: ${mapID}`);
		db.doc(DBPath(`maps/${mapID}`)).set(map);
	}, 3000);
}

context('MapUI', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3005/personal/---TestingMap---');
		// const mfb = new MockFirebase('', '', '', '');
		// const firestoreMock = new MockFirestore('', '', '', '');

		return cy.window()
			.then((win) => {
				// win['SeedDB'] = SeedDB;
				// console.log('Set SeedDB');
				console.log('Seeding DB...');
				SeedDB(win['firestoreDB']);
			});
	});

	// https://on.cypress.io/interacting-with-elements
	it('Record how long it takes for the speed-test map to load', () => {
		// todo
	});
});

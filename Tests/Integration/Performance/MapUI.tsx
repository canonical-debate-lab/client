// eslint-disable-next-line
/// <reference types="Cypress" />

import { MockFirebase, MockFirestore } from 'firebase-mock';

context('MapUI', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3005/personal/---TestingMap---');
		// const mfb = new MockFirebase('', '', '', '');
		const firestoreMock = new MockFirestore('', '', '', '');
	});

	// https://on.cypress.io/interacting-with-elements
	it('Record how long it takes for the speed-test map to load', () => {
		// todo
	});
});

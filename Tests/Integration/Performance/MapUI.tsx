// eslint-disable-next-line
/// <reference types="Cypress" />

context('Actions', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3005/personal/---TestingMap---');
	});

	// https://on.cypress.io/interacting-with-elements
	it('Record how long it takes for the speed-test map to load', () => {
		// todo
	});
});

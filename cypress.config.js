module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
  retries: 0,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000
};

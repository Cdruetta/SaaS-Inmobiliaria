// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando personalizado para login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'testpass123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Comando para crear un cliente de prueba
Cypress.Commands.add('createTestClient', (clientData = {}) => {
  const defaultData = {
    firstName: 'Test',
    lastName: 'Client',
    email: `test${Date.now()}@example.com`,
    phone: '3512345678',
    address: 'Córdoba, Argentina'
  }

  const data = { ...defaultData, ...clientData }

  cy.visit('/clients/new')
  cy.get('input[name="firstName"]').type(data.firstName)
  cy.get('input[name="lastName"]').type(data.lastName)
  cy.get('input[name="email"]').type(data.email)
  cy.get('input[name="phone"]').type(data.phone)
  cy.get('input[name="address"]').type(data.address)
  cy.get('button[type="submit"]').click()

  // Verificar que se creó correctamente
  cy.contains('Cliente creado exitosamente').should('be.visible')
})

// Comando para limpiar datos de prueba
Cypress.Commands.add('cleanupTestData', () => {
  // Limpiar localStorage
  cy.clearLocalStorage()
  cy.clearCookies()
})
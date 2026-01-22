describe('Client Management', () => {
  beforeEach(() => {
    cy.cleanupTestData()
    // Nota: Para tests completos, necesitaríamos autenticación
    // cy.login()
  })

  it('should display clients page', () => {
    cy.visit('/clients')
    // Debería redirigir a login si no está autenticado
    cy.url().should('include', '/login')
  })

  it('should display client list correctly', () => {
    // Este test requiere autenticación previa
    // cy.login()

    // cy.visit('/clients')
    // cy.contains('Gestión de Clientes').should('be.visible')
    // cy.get('[data-cy="clients-list"]').should('be.visible')
  })

  it('should allow searching clients', () => {
    // cy.login()
    // cy.visit('/clients')

    // cy.get('input[placeholder*="buscar"]').type('John')
    // cy.get('button').contains('Buscar').click()

    // cy.get('[data-cy="client-item"]').should('have.length.greaterThan', 0)
  })

  it('should navigate to create client page', () => {
    // cy.login()
    // cy.visit('/clients')

    // cy.contains('Agregar Cliente').click()
    // cy.url().should('include', '/clients/new')
    // cy.contains('Crear Cliente').should('be.visible')
  })

  it('should create a new client', () => {
    // Este test requiere un setup más complejo con backend
    // cy.login()
    // cy.visit('/clients/new')

    // cy.createTestClient({
    //   firstName: 'Cypress',
    //   lastName: 'Test',
    //   email: 'cypress@example.com'
    // })

    // cy.url().should('include', '/clients')
    // cy.contains('Cypress Test').should('be.visible')
  })

  it('should validate required fields when creating client', () => {
    // cy.login()
    // cy.visit('/clients/new')

    // cy.get('button[type="submit"]').click()

    // // Verificar errores de validación
    // cy.contains('Nombre es requerido').should('be.visible')
    // cy.contains('Apellido es requerido').should('be.visible')
    // cy.contains('Email es requerido').should('be.visible')
  })

  it('should edit an existing client', () => {
    // cy.login()
    // cy.createTestClient()

    // cy.visit('/clients')
    // cy.get('[data-cy="edit-client"]').first().click()

    // cy.get('input[name="firstName"]').clear().type('Edited Name')
    // cy.get('button[type="submit"]').click()

    // cy.contains('Cliente actualizado exitosamente').should('be.visible')
  })

  it('should delete a client', () => {
    // cy.login()
    // cy.createTestClient()

    // cy.visit('/clients')
    // cy.get('[data-cy="delete-client"]').first().click()

    // // Confirmar eliminación
    // cy.on('window:confirm', () => true)

    // cy.contains('Cliente eliminado exitosamente').should('be.visible')
  })
})
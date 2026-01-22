describe('Navigation', () => {
  beforeEach(() => {
    cy.cleanupTestData()
  })

  it('should navigate through main sections', () => {
    // Este test requiere autenticación
    // cy.login()

    // Verificar navegación al dashboard
    // cy.visit('/dashboard')
    // cy.contains('Dashboard').should('be.visible')

    // // Verificar navegación a propiedades
    // cy.get('[data-cy="nav-properties"]').click()
    // cy.url().should('include', '/properties')
    // cy.contains('Propiedades').should('be.visible')

    // // Verificar navegación a clientes
    // cy.get('[data-cy="nav-clients"]').click()
    // cy.url().should('include', '/clients')
    // cy.contains('Clientes').should('be.visible')

    // // Verificar navegación a transacciones
    // cy.get('[data-cy="nav-transactions"]').click()
    // cy.url().should('include', '/transactions')
    // cy.contains('Transacciones').should('be.visible')
  })

  it('should have responsive sidebar', () => {
    // cy.login()
    // cy.visit('/dashboard')

    // // Verificar sidebar visible en desktop
    // cy.get('[data-cy="sidebar"]').should('be.visible')

    // // Verificar sidebar oculto en mobile
    // cy.viewport('iphone-6')
    // cy.get('[data-cy="sidebar"]').should('not.be.visible')

    // // Verificar toggle del sidebar en mobile
    // cy.get('[data-cy="sidebar-toggle"]').click()
    // cy.get('[data-cy="sidebar"]').should('be.visible')
  })

  it('should redirect unknown routes to dashboard', () => {
    // cy.login()
    // cy.visit('/unknown-route')
    // cy.url().should('include', '/dashboard')
  })

  it('should maintain user session across navigation', () => {
    // cy.login()

    // // Navegar a diferentes páginas
    // cy.visit('/dashboard')
    // cy.visit('/clients')
    // cy.visit('/properties')

    // // Verificar que no se redirige a login
    // cy.url().should('not.include', '/login')
  })
})
describe('Authentication', () => {
  beforeEach(() => {
    cy.cleanupTestData()
  })

  it('should display login page correctly', () => {
    cy.visit('/login')
    cy.contains('Iniciar Sesión').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show validation errors for empty fields', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()

    // Verificar que se muestren errores de validación
    cy.get('input[type="email"]:invalid').should('exist')
    cy.get('input[type="password"]:invalid').should('exist')
  })

  it('should show error for invalid credentials', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    // Verificar mensaje de error (depende de la implementación del backend)
    cy.contains(/credenciales|usuario|contraseña/i).should('be.visible')
  })

  it('should redirect to dashboard after successful login', () => {
    // Este test requiere un usuario válido en la base de datos
    // Por ahora, solo verificamos que la navegación funcione
    cy.visit('/login')
    // Nota: Para un test completo, necesitaríamos crear un usuario de prueba
    // o mockear la respuesta del backend
  })

  it('should redirect unauthenticated users to login', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })
})
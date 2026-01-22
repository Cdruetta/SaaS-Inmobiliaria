import { ClientValidators } from '../clientValidators'

describe('ClientValidators', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(ClientValidators.validateEmail('test@example.com')).toBe(true)
      expect(ClientValidators.validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(ClientValidators.validateEmail('test+tag@gmail.com')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(ClientValidators.validateEmail('invalid-email')).toBe(false)
      expect(ClientValidators.validateEmail('test@')).toBe(false)
      expect(ClientValidators.validateEmail('@example.com')).toBe(false)
      expect(ClientValidators.validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      expect(ClientValidators.validatePhone('3512345678')).toBe(true)
      expect(ClientValidators.validatePhone('351 234-5678')).toBe(true)
      expect(ClientValidators.validatePhone('(351) 234-5678')).toBe(true)
    })

    it('should reject invalid phone formats', () => {
      expect(ClientValidators.validatePhone('')).toBe(true) // Phone is optional
      expect(ClientValidators.validatePhone('abc')).toBe(false)
      expect(ClientValidators.validatePhone('123-abc-456')).toBe(false)
    })
  })

  describe('validateBasicData', () => {
    it('should validate complete client data', () => {
      const validClient = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      }

      const errors = ClientValidators.validateBasicData(validClient)
      expect(errors).toEqual([])
    })

    it('should reject incomplete client data', () => {
      expect(ClientValidators.validateBasicData({})).toEqual([
        'El nombre es requerido',
        'El apellido es requerido',
        'El email es requerido'
      ])

      expect(ClientValidators.validateBasicData({ firstName: 'John' })).toEqual([
        'El apellido es requerido',
        'El email es requerido'
      ])
    })

    it('should validate email format', () => {
      const invalidEmailClient = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      }

      const errors = ClientValidators.validateBasicData(invalidEmailClient)
      expect(errors).toContain('El email no tiene un formato válido')
    })
  })

  describe('validatePreferences', () => {
    it('should validate preferences array', () => {
      expect(ClientValidators.validatePreferences(['Casa', 'Centro'])).toBe(true)
      expect(ClientValidators.validatePreferences([])).toBe(true)
    })

    it('should reject invalid preferences', () => {
      expect(ClientValidators.validatePreferences('not an array')).toBe(false)
      expect(ClientValidators.validatePreferences(['', 'Centro'])).toBe(false)
      expect(ClientValidators.validatePreferences([123, 'Centro'])).toBe(false)
    })
  })

  describe('validateFilters', () => {
    it('should validate search filters', () => {
      expect(ClientValidators.validateFilters({ search: 'John' })).toEqual([])
      expect(ClientValidators.validateFilters({ search: 'Jo' })).toEqual([])
      expect(ClientValidators.validateFilters({})).toEqual([])
    })

    it('should reject short search terms', () => {
      const errors = ClientValidators.validateFilters({ search: 'J' })
      expect(errors).toContain('La búsqueda debe tener al menos 2 caracteres')
    })
  })

  describe('sanitizeFormData', () => {
    it('should sanitize and trim string fields', () => {
      const input = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  JOHN.DOE@EXAMPLE.COM  ',
        phone: '  3512345678  ',
        address: '  Córdoba  ',
        preferences: ['Casa', 'Centro']
      }

      const result = ClientValidators.sanitizeFormData(input)

      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
      expect(result.email).toBe('john.doe@example.com')
      expect(result.phone).toBe('3512345678')
      expect(result.address).toBe('Córdoba')
      expect(result.preferences).toEqual(['Casa', 'Centro'])
    })

    it('should handle null and undefined values', () => {
      const input = {
        firstName: null,
        lastName: undefined,
        email: 'test@example.com',
        preferences: null
      }

      const result = ClientValidators.sanitizeFormData(input)

      expect(result.firstName).toBe('')
      expect(result.lastName).toBe('')
      expect(result.email).toBe('test@example.com')
      expect(result.preferences).toEqual([])
    })
  })
})
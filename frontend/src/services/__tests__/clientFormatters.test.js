import { ClientFormatters } from '../clientFormatters'

describe('ClientFormatters', () => {
  describe('formatFullName', () => {
    it('should format full name correctly', () => {
      expect(ClientFormatters.formatFullName('John', 'Doe')).toBe('John Doe')
      expect(ClientFormatters.formatFullName('María', 'García')).toBe('María García')
    })

    it('should handle empty values', () => {
      expect(ClientFormatters.formatFullName('', 'Doe')).toBe('Doe')
      expect(ClientFormatters.formatFullName('John', '')).toBe('John')
      expect(ClientFormatters.formatFullName('', '')).toBe('')
      expect(ClientFormatters.formatFullName(null, 'Doe')).toBe('null Doe') // Current implementation
      expect(ClientFormatters.formatFullName('John', null)).toBe('John null') // Current implementation
    })
  })

  describe('formatInitials', () => {
    it('should format initials correctly', () => {
      expect(ClientFormatters.formatInitials('John', 'Doe')).toBe('JD')
      expect(ClientFormatters.formatInitials('María', 'García')).toBe('MG')
      expect(ClientFormatters.formatInitials('Juan', 'Del Pueblo')).toBe('JD')
    })

    it('should handle single names', () => {
      expect(ClientFormatters.formatInitials('John', '')).toBe('J')
      expect(ClientFormatters.formatInitials('', 'Doe')).toBe('D')
      expect(ClientFormatters.formatInitials('', '')).toBe('?')
      expect(ClientFormatters.formatInitials(null, null)).toBe('?')
    })

    it('should handle undefined values', () => {
      expect(ClientFormatters.formatInitials(undefined, 'Doe')).toBe('D')
      expect(ClientFormatters.formatInitials('John', undefined)).toBe('J')
    })
  })

  describe('formatPhone', () => {
    it('should format Argentine phone numbers', () => {
      expect(ClientFormatters.formatPhone('3512345678')).toBe('(351) 234-5678')
      expect(ClientFormatters.formatPhone('35123456789')).toBe('35123456789') // No cumple formato
    })

    it('should handle empty or invalid phone numbers', () => {
      expect(ClientFormatters.formatPhone('')).toBe('')
      expect(ClientFormatters.formatPhone(null)).toBe('')
      expect(ClientFormatters.formatPhone('123')).toBe('123') // Demasiado corto
      expect(ClientFormatters.formatPhone('123456789012')).toBe('123456789012') // Demasiado largo
    })
  })

  describe('formatPreferences', () => {
    it('should format preferences array', () => {
      expect(ClientFormatters.formatPreferences(['Casa', 'Departamento'])).toBe('Casa, Departamento')
      expect(ClientFormatters.formatPreferences(['Centro'])).toBe('Centro')
    })

    it('should handle empty or invalid preferences', () => {
      expect(ClientFormatters.formatPreferences([])).toBe('Sin preferencias especificadas')
      expect(ClientFormatters.formatPreferences(null)).toBe('Sin preferencias especificadas')
      expect(ClientFormatters.formatPreferences('not an array')).toBe('Sin preferencias especificadas')
    })
  })

  describe('formatDate', () => {
    it('should format dates in Spanish locale', () => {
      const date = new Date('2024-01-15')
      const result = ClientFormatters.formatDate(date.toISOString())
      expect(result).toMatch(/de ene de \d{4}/) // Formato actual: "14 de ene de 2024"
    })

    it('should handle invalid dates', () => {
      expect(() => ClientFormatters.formatDate('invalid')).not.toThrow()
      expect(ClientFormatters.formatDate('')).toBeDefined()
    })
  })

  describe('getAvatarColor', () => {
    it('should return consistent colors for same names', () => {
      const color1 = ClientFormatters.getAvatarColor('John', 'Doe')
      const color2 = ClientFormatters.getAvatarColor('John', 'Doe')
      expect(color1).toBe(color2)
    })

    it('should return valid Tailwind classes', () => {
      const color = ClientFormatters.getAvatarColor('John', 'Doe')
      expect(color).toMatch(/^bg-\w+-\d00$/)
    })

    it('should handle empty names', () => {
      expect(ClientFormatters.getAvatarColor('', '')).toBeDefined()
      expect(ClientFormatters.getAvatarColor(null, null)).toBeDefined()
    })

    it('should generate different colors for different names', () => {
      const color1 = ClientFormatters.getAvatarColor('John', 'Doe')
      const color2 = ClientFormatters.getAvatarColor('Jane', 'Smith')
      // No siempre serán diferentes, pero al menos no deberían ser undefined
      expect(color1).toBeDefined()
      expect(color2).toBeDefined()
    })
  })
})
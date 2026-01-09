/**
 * Servicio de validación para propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class PropertyValidator {
  /**
   * Valida los datos para crear una propiedad
   * @param {Object} propertyData - Datos de la propiedad
   * @throws {Error} Si la validación falla
   */
  validateCreate(propertyData) {
    const requiredFields = ['title', 'type', 'price', 'address', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    this.validatePrice(propertyData.price);
    this.validateType(propertyData.type);
    this.validateStatus(propertyData.status);
  }

  /**
   * Valida el precio
   * @param {any} price - Precio a validar
   * @throws {Error} Si el precio no es válido
   */
  validatePrice(price) {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new Error('El precio debe ser un número positivo');
    }
  }

  /**
   * Valida el tipo de propiedad
   * @param {string} type - Tipo de propiedad
   * @throws {Error} Si el tipo no es válido
   */
  validateType(type) {
    const validTypes = ['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL'];
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de propiedad no válido. Debe ser uno de: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Valida el estado de la propiedad
   * @param {string} status - Estado de la propiedad
   * @throws {Error} Si el estado no es válido
   */
  validateStatus(status) {
    const validStatuses = ['AVAILABLE', 'SOLD', 'RENTED', 'PENDING'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`Estado no válido. Debe ser uno de: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Valida y sanitiza los datos de entrada
   * @param {Object} propertyData - Datos a sanitizar
   * @returns {Object} Datos sanitizados
   */
  sanitize(propertyData) {
    return {
      title: propertyData.title?.trim(),
      description: propertyData.description?.trim(),
      type: propertyData.type,
      status: propertyData.status || 'AVAILABLE',
      price: parseFloat(propertyData.price),
      address: propertyData.address?.trim(),
      city: propertyData.city?.trim(),
      state: propertyData.state?.trim(),
      zipCode: propertyData.zipCode?.trim(),
      bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
      bathrooms: propertyData.bathrooms ? parseFloat(propertyData.bathrooms) : null,
      area: propertyData.area ? parseFloat(propertyData.area) : null,
      yearBuilt: propertyData.yearBuilt ? parseInt(propertyData.yearBuilt) : null,
      features: propertyData.features || [],
      images: propertyData.images || []
    };
  }
}

module.exports = PropertyValidator;
const propertyService = require('../services/propertyService');

class PropertyController {
  // Get all properties
  async getAllProperties(req, res) {
    try {
      const filters = req.query;
      const userId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await propertyService.getAllProperties(filters, userId);

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo propiedades:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get property by ID
  async getPropertyById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const property = await propertyService.getPropertyById(id, userId);

      res.json({ property });
    } catch (error) {
      console.error('Error obteniendo propiedad:', error);
      if (error.message === 'Propiedad no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Create new property
  async createProperty(req, res) {
    try {
      const propertyData = req.body;
      const ownerId = req.user.id;

      const property = await propertyService.createProperty(propertyData, ownerId);

      res.status(201).json({
        message: 'Propiedad creada exitosamente',
        property
      });
    } catch (error) {
      console.error('Error creando propiedad:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Update property
  async updateProperty(req, res) {
    try {
      const { id } = req.params;
      const propertyData = req.body;
      const userId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const property = await propertyService.updateProperty(id, propertyData, userId);

      res.json({
        message: 'Propiedad actualizada exitosamente',
        property
      });
    } catch (error) {
      console.error('Error actualizando propiedad:', error);
      if (error.message === 'Propiedad no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Delete property
  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await propertyService.deleteProperty(id, userId);

      res.json(result);
    } catch (error) {
      console.error('Error eliminando propiedad:', error);
      if (error.message === 'Propiedad no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'No se puede eliminar una propiedad con transacciones activas') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get property statistics
  async getPropertyStats(req, res) {
    try {
      // Si es ADMIN, puede ver todas las estadísticas, si no, solo las suyas
      const userId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const stats = await propertyService.getPropertyStats(userId);

      res.json({ stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PropertyController();

const ClientService = require('../services/clientService');
const clientService = new ClientService();

class ClientController {
  // Get all clients
  async getAllClients(req, res) {
    try {
      const filters = req.query;
      // Si es ADMIN, puede ver todos los clientes, si no, solo los suyos
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await clientService.getAllClients(filters, agentId);

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get client by ID
  async getClientById(req, res) {
    try {
      const { id } = req.params;
      // Si es ADMIN, puede ver cualquier cliente, si no, solo los suyos
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const client = await clientService.getClientById(id, agentId);

      res.json({ client });
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      if (error.message === 'Cliente no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Create new client
  async createClient(req, res) {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!req.user.id) {
        return res.status(400).json({ error: 'ID de usuario no válido' });
      }

      const clientData = req.body;
      const agentId = req.user.id;

      const client = await clientService.createClient(clientData, agentId);

      res.status(201).json({
        message: 'Cliente creado exitosamente',
        client
      });
    } catch (error) {
      console.error('Error creando cliente:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Update client
  async updateClient(req, res) {
    try {
      const { id } = req.params;
      const clientData = req.body;
      // Si es ADMIN, puede actualizar cualquier cliente, si no, solo los suyos
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const client = await clientService.updateClient(id, clientData, agentId);

      res.json({
        message: 'Cliente actualizado exitosamente',
        client
      });
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      if (error.message === 'Cliente no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Delete client
  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      // Si es ADMIN, puede eliminar cualquier cliente, si no, solo los suyos
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await clientService.deleteClient(id, agentId);

      res.json(result);
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      if (error.message === 'Cliente no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'No se puede eliminar un cliente con transacciones activas') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get client statistics
  async getClientStats(req, res) {
    try {
      // Si es ADMIN, puede ver todas las estadísticas, si no, solo las suyas
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const stats = await clientService.getClientStats(agentId);

      res.json({ stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas de clientes:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ClientController();

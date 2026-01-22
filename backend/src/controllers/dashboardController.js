const propertyService = require('../services/propertyService');
const clientService = require('../services/clientService');
const transactionService = require('../services/transactionService');

class DashboardController {
  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      // Si es ADMIN, puede ver todas las estadísticas, si no, solo las suyas
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      // Obtener estadísticas de propiedades (todos los datos para admin)
      const propertyStats = await propertyService.getPropertyStats(null);

      // Obtener estadísticas de clientes (todos los datos para admin)
      const clientStats = await clientService.getClientStats(null);

      // Obtener estadísticas de transacciones (todos los datos para admin)
      const transactionStats = await transactionService.getTransactionStats(null);

      // Combinar todas las estadísticas
      const stats = {
        totalProperties: propertyStats.totalProperties || 0,
        totalClients: clientStats.totalClients || 0,
        totalTransactions: transactionStats.totalTransactions || 0,
        totalValue: transactionStats.totalAmount || 0
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);

      // Retornar estadísticas por defecto en caso de error
      res.json({
        stats: {
          totalProperties: 0,
          totalClients: 0,
          totalTransactions: 0,
          totalValue: 0
        }
      });
    }
  }
}

module.exports = new DashboardController();
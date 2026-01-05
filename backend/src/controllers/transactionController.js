const transactionService = require('../services/transactionService');

class TransactionController {
  // Get all transactions
  async getAllTransactions(req, res) {
    try {
      const filters = req.query;
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await transactionService.getAllTransactions(filters, agentId);

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get transaction by ID
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const transaction = await transactionService.getTransactionById(id, agentId);

      res.json({ transaction });
    } catch (error) {
      console.error('Error obteniendo transacción:', error);
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Create new transaction
  async createTransaction(req, res) {
    try {
      const transactionData = req.body;
      const agentId = req.user.id;

      const transaction = await transactionService.createTransaction(transactionData, agentId);

      res.status(201).json({
        message: 'Transacción creada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('Error creando transacción:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Update transaction
  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const transactionData = req.body;
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const transaction = await transactionService.updateTransaction(id, transactionData, agentId);

      res.json({
        message: 'Transacción actualizada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Delete transaction
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const result = await transactionService.deleteTransaction(id, agentId);

      res.json(result);
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get transaction statistics
  async getTransactionStats(req, res) {
    try {
      // Si es ADMIN, puede ver todas las estadísticas, si no, solo las suyas
      const agentId = req.user?.role === 'ADMIN' ? null : req.user?.id;

      const stats = await transactionService.getTransactionStats(agentId);

      res.json({ stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas de transacciones:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();

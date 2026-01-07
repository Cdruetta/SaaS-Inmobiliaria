const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Get all transactions (with optional filters)
router.get('/', transactionController.getAllTransactions);

// Get transaction statistics
router.get('/stats', transactionController.getTransactionStats);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Create new transaction
router.post('/', transactionController.createTransaction);

// Update transaction (agents can update their own transactions)
router.put('/:id', transactionController.updateTransaction);

// Delete transaction (agents can delete their own transactions)
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;

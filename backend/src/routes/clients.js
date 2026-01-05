const express = require('express');
const clientController = require('../controllers/clientController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Get all clients (with optional filters)
router.get('/', clientController.getAllClients);

// Get client statistics
router.get('/stats', clientController.getClientStats);

// Get client by ID
router.get('/:id', clientController.getClientById);

// Create new client
router.post('/', clientController.createClient);

// Update client
router.put('/:id', clientController.updateClient);

// Delete client (only admins can delete any client)
router.delete('/:id', authorizeRoles('ADMIN'), clientController.deleteClient);

module.exports = router;

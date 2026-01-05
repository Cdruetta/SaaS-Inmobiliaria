const express = require('express');
const propertyController = require('../controllers/propertyController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Get all properties (with optional filters)
router.get('/', propertyController.getAllProperties);

// Get property statistics
router.get('/stats', propertyController.getPropertyStats);

// Get property by ID
router.get('/:id', propertyController.getPropertyById);

// Create new property
router.post('/', propertyController.createProperty);

// Update property
router.put('/:id', propertyController.updateProperty);

// Delete property (only admins can delete any property)
router.delete('/:id', authorizeRoles('ADMIN'), propertyController.deleteProperty);

module.exports = router;

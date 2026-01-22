const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Get dashboard statistics (requiere autenticación)
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

// Endpoint temporal sin autenticación para testing
router.get('/stats-test', dashboardController.getDashboardStats);

module.exports = router;
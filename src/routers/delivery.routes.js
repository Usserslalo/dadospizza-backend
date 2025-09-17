// src/routers/delivery.routes.js

const express = require('express');
const router = express.Router();

// Importar middlewares
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// Importar controlador
const deliveryController = require('../controllers/delivery.controller');

// Aplicar middlewares de autenticación y autorización a todas las rutas
router.use(authMiddleware);
router.use(checkRole('REPARTIDOR'));

// Rutas del repartidor
router.get('/my-orders', deliveryController.getMyAssignedOrders);
router.put('/orders/:id/status', deliveryController.updateOrderStatus);

module.exports = router;

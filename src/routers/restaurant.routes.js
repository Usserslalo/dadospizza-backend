// src/routers/restaurant.routes.js

const express = require('express');
const router = express.Router();
const { getOrders, updateOrderStatus } = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

/**
 * @route GET /api/restaurant/orders
 * @desc Obtener pedidos por estado para la sucursal del empleado
 * @access Private (RESTAURANTE role required)
 * @query {string} status - Estado del pedido (opcional): PAGADO, EN PREPARACION, DESPACHADO, EN CAMINO, ENTREGADO, CANCELADO
 * @example GET /api/restaurant/orders?status=PAGADO
 */
router.get('/orders', authMiddleware, checkRole('RESTAURANTE'), getOrders);

/**
 * @route PUT /api/restaurant/orders/:id/status
 * @desc Actualizar el estado de un pedido específico
 * @access Private (RESTAURANTE role required)
 * @param {string} id - ID del pedido a actualizar
 * @body {string} status - Nuevo estado del pedido: PAGADO, EN PREPARACION, DESPACHADO, EN CAMINO, ENTREGADO, CANCELADO
 * @example PUT /api/restaurant/orders/1/status
 * @body {
 *   "status": "EN PREPARACION"
 * }
 */
router.put('/orders/:id/status', authMiddleware, checkRole('RESTAURANTE'), updateOrderStatus);

module.exports = router;

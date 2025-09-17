// src/routers/orders.routes.js

const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orders.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route POST /api/orders
 * @desc Crear un nuevo pedido
 * @access Private (requiere autenticación)
 * @body {
 *   "id_address": 1,
 *   "id_branch": 1,
 *   "payment_method": "Efectivo",
 *   "products": [
 *     {
 *       "id_product": 7,
 *       "quantity": 1,
 *       "id_size": 3,
 *       "addons": [2]
 *     }
 *   ]
 * }
 */
router.post('/', authMiddleware, createOrder);

module.exports = router;

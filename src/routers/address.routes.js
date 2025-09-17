// src/routers/address.routes.js

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para gestión de direcciones
router.post('/', addressController.createAddress);           // POST /api/addresses
router.get('/', addressController.getAddressesByUser);       // GET /api/addresses
router.put('/:id', addressController.updateAddress);         // PUT /api/addresses/:id
router.delete('/:id', addressController.deleteAddress);      // DELETE /api/addresses/:id

module.exports = router;

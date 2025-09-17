// src/routers/products.routes.js

const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsByCategory,
  getProductById
} = require('../controllers/products.controller');

// Rutas públicas (sin autenticación)
router.get('/', getAllProducts);                    // GET /api/products
router.get('/:id', getProductById);                 // GET /api/products/:id

// Ruta para productos por categoría (se registrará en server.js)
router.get('/categories/:id/products', getProductsByCategory); // GET /api/categories/:id/products

module.exports = router;

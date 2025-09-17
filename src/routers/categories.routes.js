// src/routes/categories.routes.js

const { Router } = require('express');
const categoriesController = require('../controllers/categories.controller');
const { getProductsByCategory } = require('../controllers/products.controller');

const router = Router();

// Cuando se haga una petición GET a la raíz '/', se ejecutará la función 'getAll' del controlador
router.get('/', categoriesController.getAll);

// Ruta para obtener productos por categoría
router.get('/:id/products', getProductsByCategory);

module.exports = router;
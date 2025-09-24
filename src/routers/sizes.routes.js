// src/routers/sizes.routes.js

const express = require('express');
const router = express.Router();
const { getAllSizes, getSizeById } = require('../controllers/sizes.controller');

// GET /api/sizes - Obtener todos los tamaños
router.get('/', getAllSizes);

// GET /api/sizes/:id - Obtener un tamaño por ID
router.get('/:id', getSizeById);

module.exports = router;

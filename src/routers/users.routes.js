// src/routers/users.routes.js

const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Ruta POST para registro de usuarios
router.post('/register', usersController.register);

// Ruta POST para login de usuarios
router.post('/login', usersController.login);

// Ruta GET protegida para obtener el perfil del usuario autenticado
router.get('/profile', authMiddleware, usersController.getProfile);

module.exports = router;

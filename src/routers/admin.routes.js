// src/routes/admin.routes.js
const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const router = Router();

router.post('/seed', adminController.seedDatabase);

module.exports = router;
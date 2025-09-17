// src/controllers/categories.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener todas las categorías
const getAll = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron obtener las categorías.' });
  }
};

module.exports = {
  getAll,
};
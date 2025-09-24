// src/controllers/categories.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener todas las categorías
const getAll = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  getAll,
};
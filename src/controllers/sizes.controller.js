// src/controllers/sizes.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc Obtener todos los tamaños disponibles
 * @route GET /api/sizes
 * @access Public
 */
const getAllSizes = async (req, res) => {
  try {
    const sizes = await prisma.sizes.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: sizes
    });
  } catch (error) {
    console.error('Error al obtener tamaños:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * @desc Obtener un tamaño por ID
 * @route GET /api/sizes/:id
 * @access Public
 */
const getSizeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el id sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tamaño inválido'
      });
    }

    const size = await prisma.sizes.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    if (!size) {
      return res.status(404).json({
        success: false,
        message: 'Tamaño no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: size
    });
  } catch (error) {
    console.error('Error al obtener tamaño por ID:', error);
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
  getAllSizes,
  getSizeById
};

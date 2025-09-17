// src/controllers/products.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/products - Obtener todos los productos
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      include: {
        categories: true,
        product_images: true
      },
      where: {
        is_available: true
      }
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET /api/categories/:id/products - Obtener productos por categoría
const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el id sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    const products = await prisma.products.findMany({
      where: {
        id_category: parseInt(id),
        is_available: true
      },
      include: {
        categories: true,
        product_images: true
      }
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET /api/products/:id - Obtener detalle de un producto
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el id sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const product = await prisma.products.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        categories: true,
        product_images: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si el producto tiene precio fijo o variable
    if (product.price !== null) {
      // Producto con precio fijo (bebidas, Megamix, etc.)
      res.status(200).json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.categories,
          images: product.product_images,
          is_available: product.is_available
        }
      });
    } else {
      // Producto con precios variables (pizzas)
      const categoryPrices = await prisma.category_prices.findMany({
        where: {
          id_category: product.id_category
        },
        include: {
          sizes: true
        }
      });

      // Formatear los precios según el formato requerido
      const prices = categoryPrices.map(cp => ({
        size: cp.sizes.name,
        price: cp.price.toString()
      }));

      res.status(200).json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices,
          category: product.categories,
          images: product.product_images,
          is_available: product.is_available
        }
      });
    }
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getProductById
};

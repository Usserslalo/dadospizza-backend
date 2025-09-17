// src/controllers/address.controller.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Crear una nueva dirección para el usuario autenticado
 * POST /api/addresses
 */
const createAddress = async (req, res) => {
  try {
    const { address, neighborhood, lat, lng, alias } = req.body;
    const userId = req.user.userId;

    // Validar campos requeridos
    if (!address || !neighborhood || lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Los campos address, neighborhood, lat y lng son requeridos'
      });
    }

    // Validar que lat y lng sean números válidos
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Los campos lat y lng deben ser números válidos'
      });
    }

    // Crear la nueva dirección
    const newAddress = await prisma.address.create({
      data: {
        id_user: BigInt(userId),
        address,
        neighborhood,
        alias: alias || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Convertir BigInt a string para la respuesta JSON
    const responseAddress = {
      ...newAddress,
      id: newAddress.id.toString(),
      id_user: newAddress.id_user.toString()
    };

    res.status(201).json({
      message: 'Dirección creada exitosamente',
      data: responseAddress
    });

  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear la dirección'
    });
  }
};

/**
 * Obtener todas las direcciones del usuario autenticado
 * GET /api/addresses
 */
const getAddressesByUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar todas las direcciones del usuario
    const addresses = await prisma.address.findMany({
      where: {
        id_user: BigInt(userId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Convertir BigInt a string para la respuesta JSON
    const responseAddresses = addresses.map(address => ({
      ...address,
      id: address.id.toString(),
      id_user: address.id_user.toString()
    }));

    res.status(200).json({
      message: 'Direcciones obtenidas exitosamente',
      data: responseAddresses
    });

  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener las direcciones'
    });
  }
};

/**
 * Actualizar una dirección existente del usuario autenticado
 * PUT /api/addresses/:id
 */
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address, neighborhood, lat, lng, alias } = req.body;
    const userId = req.user.userId;

    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'El ID de la dirección debe ser un número válido'
      });
    }

    // Verificar que la dirección existe y pertenece al usuario
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        id_user: BigInt(userId)
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Dirección no encontrada o no tienes permisos para modificarla'
      });
    }

    // Preparar los datos a actualizar
    const updateData = {
      updated_at: new Date()
    };

    // Solo actualizar los campos que se proporcionen
    if (address !== undefined) updateData.address = address;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (lat !== undefined) {
      if (isNaN(lat)) {
        return res.status(400).json({
          error: 'El campo lat debe ser un número válido'
        });
      }
      updateData.lat = parseFloat(lat);
    }
    if (lng !== undefined) {
      if (isNaN(lng)) {
        return res.status(400).json({
          error: 'El campo lng debe ser un número válido'
        });
      }
      updateData.lng = parseFloat(lng);
    }
    if (alias !== undefined) updateData.alias = alias || null;

    // Actualizar la dirección
    const updatedAddress = await prisma.address.update({
      where: {
        id: BigInt(id)
      },
      data: updateData
    });

    // Convertir BigInt a string para la respuesta JSON
    const responseAddress = {
      ...updatedAddress,
      id: updatedAddress.id.toString(),
      id_user: updatedAddress.id_user.toString()
    };

    res.status(200).json({
      message: 'Dirección actualizada exitosamente',
      data: responseAddress
    });

  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar la dirección'
    });
  }
};

/**
 * Eliminar una dirección del usuario autenticado
 * DELETE /api/addresses/:id
 */
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'El ID de la dirección debe ser un número válido'
      });
    }

    // Verificar que la dirección existe y pertenece al usuario
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        id_user: BigInt(userId)
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Dirección no encontrada o no tienes permisos para eliminarla'
      });
    }

    // Eliminar la dirección
    await prisma.address.delete({
      where: {
        id: BigInt(id)
      }
    });

    res.status(200).json({
      message: 'Dirección eliminada correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({
      error: 'Error interno del servidor al eliminar la dirección'
    });
  }
};

module.exports = {
  createAddress,
  getAddressesByUser,
  updateAddress,
  deleteAddress
};

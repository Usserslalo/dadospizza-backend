// src/controllers/restaurant.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const branchDeliveryService = require('../services/branch-delivery-assignment.service');

// Función legacy mantenida para compatibilidad (deprecated)
async function findAvailableDelivery(branchId) {
  console.log('⚠️ Usando función legacy findAvailableDelivery. Considera usar branchDeliveryService');
  return null;
}

/**
 * @desc Obtener pedidos por estado para la sucursal del empleado
 * @route GET /api/restaurant/orders?status=PAGADO
 * @access Private (RESTAURANTE role required)
 */
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.userId;

    // Buscar al usuario para obtener su id_branch
    const user = await prisma.users.findUnique({
      where: {
        id: BigInt(userId)
      },
      select: {
        id_branch: true
      }
    });

    if (!user || !user.id_branch) {
      return res.status(400).json({
        error: 'Usuario no asociado a ninguna sucursal'
      });
    }

    // Construir la condición where
    const whereCondition = {
      id_branch: user.id_branch
    };

    // Si se especifica un status, agregarlo a la condición
    if (status) {
      // Mapear el estado de entrada al valor del enum de Prisma
      const statusMapping = {
        'PAGADO': 'PAGADO',
        'EN PREPARACION': 'EN_PREPARACION',
        'DESPACHADO': 'DESPACHADO',
        'EN CAMINO': 'EN_CAMINO',
        'ENTREGADO': 'ENTREGADO',
        'CANCELADO': 'CANCELADO'
      };
      
      const prismaStatus = statusMapping[status];
      if (prismaStatus) {
        whereCondition.status = prismaStatus;
      }
    }

    // Buscar los pedidos de la sucursal del empleado
    const orders = await prisma.orders.findMany({
      where: whereCondition,
      include: {
        // Información del cliente
        users_orders_id_clientTousers: {
          select: {
            id: true,
            name: true,
            lastname: true,
            phone: true,
            email: true
          }
        },
        // Información de la dirección
        address: {
          select: {
            id: true,
            address: true,
            neighborhood: true,
            alias: true,
            lat: true,
            lng: true
          }
        },
        // Información de la sucursal
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        // Productos del pedido
        order_has_products: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            sizes: {
              select: {
                id: true,
                name: true
              }
            },
            order_item_addons: {
              include: {
                addons: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Formatear la respuesta para convertir BigInt a string y manejar valores null
    const formattedOrders = orders.map(order => ({
      id: order.id.toString(),
      id_client: order.id_client.toString(),
      id_delivery: order.id_delivery ? order.id_delivery.toString() : null,
      id_address: order.id_address.toString(),
      id_branch: order.id_branch.toString(),
      status: order.status || '',
      payment_method: order.payment_method || 'Efectivo',
      subtotal: order.subtotal ? order.subtotal.toString() : '0.00',
      delivery_fee: order.delivery_fee ? order.delivery_fee.toString() : '0.00',
      total: order.total ? order.total.toString() : '0.00',
      created_at: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
      updated_at: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString(),
      client: order.users_orders_id_clientTousers ? {
        id: order.users_orders_id_clientTousers.id.toString(),
        name: order.users_orders_id_clientTousers.name || '',
        lastname: order.users_orders_id_clientTousers.lastname || '',
        phone: order.users_orders_id_clientTousers.phone || '',
        email: order.users_orders_id_clientTousers.email || ''
      } : null,
      address: order.address ? {
        id: order.address.id.toString(),
        address: order.address.address || '',
        neighborhood: order.address.neighborhood || '',
        alias: order.address.alias || null,
        lat: order.address.lat || 0,
        lng: order.address.lng || 0
      } : null,
      branch: order.branches ? {
        id: order.branches.id.toString(),
        name: order.branches.name || '',
        address: order.branches.address || '',
        phone: order.branches.phone || null
      } : null,
      products: order.order_has_products ? order.order_has_products.map(item => ({
        id: item.id.toString(),
        id_product: item.id_product.toString(),
        id_size: item.id_size ? item.id_size.toString() : null,
        quantity: item.quantity || 0,
        price_per_unit: item.price_per_unit ? item.price_per_unit.toString() : '0.00',
        product: item.products ? {
          id: item.products.id.toString(),
          name: item.products.name || '',
          description: item.products.description || ''
        } : null,
        size: item.sizes ? {
          id: item.sizes.id.toString(),
          name: item.sizes.name || ''
        } : null,
        addons: item.order_item_addons ? item.order_item_addons.map(addon => ({
          id: addon.id.toString(),
          id_addon: addon.id_addon.toString(),
          price_at_purchase: addon.price_at_purchase ? addon.price_at_purchase.toString() : '0.00',
          addon: addon.addons ? {
            id: addon.addons.id.toString(),
            name: addon.addons.name || ''
          } : null
        })) : []
      })) : []
    }));

    res.status(200).json({
      success: true,
      message: status ? `Pedidos con estado ${status} obtenidos exitosamente` : 'Pedidos obtenidos exitosamente',
      data: formattedOrders,
      filters: {
        branch_id: user.id_branch.toString(),
        status: status || 'todos'
      }
    });

  } catch (error) {
    console.error('Error al obtener pedidos del restaurante:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener los pedidos'
    });
  }
};

/**
 * @desc Actualizar el estado de un pedido específico
 * @route PUT /api/restaurant/orders/:id/status
 * @access Private (RESTAURANTE role required)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const userId = req.user.userId;

    // Validar que se proporcione el nuevo estado
    if (!newStatus) {
      return res.status(400).json({
        error: 'El campo status es requerido en el body de la petición'
      });
    }

    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'El ID del pedido debe ser un número válido'
      });
    }

    // Mapear estados de entrada a valores del enum de la base de datos
    const statusMapping = {
      'PAGADO': 'PAGADO',
      'EN PREPARACION': 'EN PREPARACION',
      'DESPACHADO': 'DESPACHADO',
      'EN CAMINO': 'EN CAMINO',
      'ENTREGADO': 'ENTREGADO',
      'CANCELADO': 'CANCELADO'
    };

    // Validar que el nuevo estado sea válido
    const validStatuses = Object.keys(statusMapping);
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        error: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
      });
    }

    // Convertir el estado a el valor del enum de Prisma
    const prismaStatus = statusMapping[newStatus];

    // Buscar al usuario para obtener su id_branch
    const user = await prisma.users.findUnique({
      where: {
        id: BigInt(userId)
      },
      select: {
        id_branch: true
      }
    });

    if (!user || !user.id_branch) {
      return res.status(400).json({
        error: 'Usuario no asociado a ninguna sucursal'
      });
    }

    // Verificar que el pedido existe y pertenece a la sucursal del empleado
    const existingOrder = await prisma.orders.findFirst({
      where: {
        id: BigInt(id),
        id_branch: user.id_branch
      },
      include: {
        users_orders_id_clientTousers: {
          select: {
            id: true,
            name: true,
            lastname: true,
            phone: true
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Pedido no encontrado o no tienes permisos para modificarlo'
      });
    }

    // Preparar datos de actualización
    let updateData = {
      status: prismaStatus,
      updated_at: new Date()
    };

    // ASIGNACIÓN AUTOMÁTICA DE REPARTIDOR POR SUCURSAL cuando el estado es DESPACHADO
    if (prismaStatus === 'DESPACHADO') {
      console.log(`🏪 Asignando repartidor para sucursal ${existingOrder.id_branch}, pedido ${id}...`);
      
      const assignment = await branchDeliveryService.assignDeliveryByBranch(
        id, 
        existingOrder.id_branch, 
        existingOrder.address
      );
      
      if (assignment.success) {
        console.log(`✅ ${assignment.message}`);
        updateData.id_delivery = assignment.delivery.id;
      } else {
        console.log(`⚠️ ${assignment.message} (Código: ${assignment.code})`);
        // Continuar sin asignar repartidor - el pedido quedará en estado DESPACHADO sin repartidor
      }
    }

    // Actualizar el estado del pedido
    const updatedOrder = await prisma.orders.update({
      where: {
        id: BigInt(id)
      },
      data: updateData,
      include: {
        users_orders_id_clientTousers: {
          select: {
            id: true,
            name: true,
            lastname: true,
            phone: true
          }
        },
        address: {
          select: {
            id: true,
            address: true,
            neighborhood: true,
            alias: true
          }
        },
        order_has_products: {
          include: {
            products: {
              select: {
                id: true,
                name: true
              }
            },
            sizes: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Formatear la respuesta
    const formattedOrder = {
      id: updatedOrder.id.toString(),
      id_client: updatedOrder.id_client.toString(),
      id_address: updatedOrder.id_address.toString(),
      id_branch: updatedOrder.id_branch.toString(),
      status: updatedOrder.status,
      payment_method: updatedOrder.payment_method,
      subtotal: updatedOrder.subtotal.toString(),
      delivery_fee: updatedOrder.delivery_fee.toString(),
      total: updatedOrder.total.toString(),
      created_at: updatedOrder.created_at,
      updated_at: updatedOrder.updated_at,
      client: updatedOrder.users_orders_id_clientTousers,
      address: updatedOrder.address,
      products: updatedOrder.order_has_products.map(item => ({
        id: item.id.toString(),
        quantity: item.quantity,
        price_per_unit: item.price_per_unit.toString(),
        product: item.products,
        size: item.sizes
      }))
    };

    // Emitir notificación en tiempo real al cliente
    try {
      const io = global.io;
      if (io) {
        const clientRoom = `client_${updatedOrder.id_client.toString()}`;
        
        // Preparar datos de la actualización para la notificación
        const statusUpdateNotification = {
          id: updatedOrder.id.toString(),
          id_client: updatedOrder.id_client.toString(),
          id_branch: updatedOrder.id_branch.toString(),
          status: updatedOrder.status,
          previous_status: existingOrder.status,
          payment_method: updatedOrder.payment_method,
          subtotal: updatedOrder.subtotal.toString(),
          delivery_fee: updatedOrder.delivery_fee.toString(),
          total: updatedOrder.total.toString(),
          updated_at: updatedOrder.updated_at,
          client: updatedOrder.users_orders_id_clientTousers,
          address: updatedOrder.address,
          timestamp: new Date().toISOString()
        };

        // Emitir evento a la sala del cliente
        io.to(clientRoom).emit('actualizacion_estado', statusUpdateNotification);
        console.log(`📢 Notificación 'actualizacion_estado' enviada a la sala: ${clientRoom}`);
      }
    } catch (socketError) {
      console.error('Error al emitir notificación de actualización de estado:', socketError);
      // No fallar la operación si hay error en Socket.IO
    }

    res.status(200).json({
      success: true,
      message: `Estado del pedido actualizado exitosamente a ${newStatus}`,
      data: formattedOrder
    });

  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar el estado del pedido'
    });
  }
};

module.exports = {
  getOrders,
  updateOrderStatus
};

// src/controllers/restaurant.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Formatear la respuesta para convertir BigInt a string
    const formattedOrders = orders.map(order => ({
      id: order.id.toString(),
      id_client: order.id_client.toString(),
      id_address: order.id_address.toString(),
      id_branch: order.id_branch.toString(),
      status: order.status,
      payment_method: order.payment_method,
      subtotal: order.subtotal.toString(),
      delivery_fee: order.delivery_fee.toString(),
      total: order.total.toString(),
      created_at: order.created_at,
      updated_at: order.updated_at,
      client: order.users_orders_id_clientTousers,
      address: order.address,
      branch: order.branches,
      products: order.order_has_products.map(item => ({
        id: item.id.toString(),
        id_product: item.id_product.toString(),
        id_size: item.id_size ? item.id_size.toString() : null,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit.toString(),
        product: item.products,
        size: item.sizes,
        addons: item.order_item_addons.map(addon => ({
          id: addon.id.toString(),
          id_addon: addon.id_addon.toString(),
          price_at_purchase: addon.price_at_purchase.toString(),
          addon: addon.addons
        }))
      }))
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

    // Mapear estados de entrada a valores del enum de Prisma
    const statusMapping = {
      'PAGADO': 'PAGADO',
      'EN PREPARACION': 'EN_PREPARACION',
      'DESPACHADO': 'DESPACHADO',
      'EN CAMINO': 'EN_CAMINO',
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

    // Actualizar el estado del pedido
    const updatedOrder = await prisma.orders.update({
      where: {
        id: BigInt(id)
      },
      data: {
        status: prismaStatus,
        updated_at: new Date()
      },
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

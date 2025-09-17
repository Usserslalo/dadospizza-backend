// src/controllers/delivery.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controlador para funcionalidades del repartidor
 * Maneja la obtención de pedidos asignados y actualización de estados
 */

/**
 * Obtener los pedidos asignados al repartidor autenticado
 * Solo muestra pedidos con estado 'DESPACHADO' o 'EN CAMINO'
 */
const getMyAssignedOrders = async (req, res) => {
  try {
    // Obtener el ID del repartidor desde el token JWT
    const deliveryUserId = req.user.userId;

    // Buscar pedidos asignados al repartidor con estados válidos
    const assignedOrders = await prisma.orders.findMany({
      where: {
        id_delivery: BigInt(deliveryUserId),
        status: {
          in: ['DESPACHADO', 'EN_CAMINO'] // Estados que puede manejar el repartidor
        }
      },
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
        // Información de la dirección de entrega
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
        created_at: 'asc' // Ordenar por fecha de creación (más antiguos primero)
      }
    });

    // Formatear la respuesta para que sea más clara
    const formattedOrders = assignedOrders.map(order => ({
      id: order.id,
      status: order.status,
      payment_method: order.payment_method,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      created_at: order.created_at,
      updated_at: order.updated_at,
      client: {
        id: order.users_orders_id_clientTousers.id,
        name: order.users_orders_id_clientTousers.name,
        lastname: order.users_orders_id_clientTousers.lastname,
        phone: order.users_orders_id_clientTousers.phone,
        email: order.users_orders_id_clientTousers.email
      },
      delivery_address: {
        id: order.address.id,
        address: order.address.address,
        neighborhood: order.address.neighborhood,
        alias: order.address.alias,
        coordinates: {
          lat: order.address.lat,
          lng: order.address.lng
        }
      },
      branch: {
        id: order.branches.id,
        name: order.branches.name,
        address: order.branches.address,
        phone: order.branches.phone
      },
      products: order.order_has_products.map(item => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          description: item.products.description
        },
        size: item.sizes ? {
          id: item.sizes.id,
          name: item.sizes.name
        } : null,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        addons: item.order_item_addons.map(addon => ({
          id: addon.id,
          name: addon.addons.name,
          price_at_purchase: addon.price_at_purchase
        }))
      }))
    }));

    res.status(200).json({
      success: true,
      message: 'Pedidos asignados obtenidos exitosamente',
      data: {
        orders: formattedOrders,
        total: formattedOrders.length
      }
    });

  } catch (error) {
    console.error('Error al obtener pedidos asignados:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener pedidos asignados'
    });
  }
};

/**
 * Actualizar el estado de un pedido específico
 * Incluye validaciones de seguridad y flujo de estados
 */
const updateOrderStatus = async (req, res) => {
  try {
    // Obtener datos de la petición
    const deliveryUserId = req.user.userId;
    const orderId = req.params.id;
    const { status: newStatus } = req.body;

    // Validar que se proporcione el nuevo estado
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: 'El campo status es requerido'
      });
    }

    // Validar que el nuevo estado sea válido para el repartidor
    const validStatuses = ['EN_CAMINO', 'ENTREGADO'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido. Los estados permitidos son: EN_CAMINO, ENTREGADO'
      });
    }

    // Buscar el pedido por ID
    const existingOrder = await prisma.orders.findUnique({
      where: {
        id: BigInt(orderId)
      }
    });

    // Verificar que el pedido existe
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenece al repartidor autenticado
    if (existingOrder.id_delivery !== BigInt(deliveryUserId)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para actualizar este pedido'
      });
    }

    // Validar transiciones de estado válidas
    const currentStatus = existingOrder.status;
    let isValidTransition = false;

    if (currentStatus === 'DESPACHADO' && newStatus === 'EN_CAMINO') {
      isValidTransition = true;
    } else if (currentStatus === 'EN_CAMINO' && newStatus === 'ENTREGADO') {
      isValidTransition = true;
    }

    if (!isValidTransition) {
      return res.status(400).json({
        success: false,
        error: 'Transición de estado no válida',
        details: {
          current_status: currentStatus,
          requested_status: newStatus,
          valid_transitions: {
            'DESPACHADO': ['EN_CAMINO'],
            'EN_CAMINO': ['ENTREGADO']
          }
        }
      });
    }

    // Actualizar el estado del pedido
    const updatedOrder = await prisma.orders.update({
      where: {
        id: BigInt(orderId)
      },
      data: {
        status: newStatus,
        updated_at: new Date()
      },
      include: {
        // Incluir información básica para la respuesta
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
        }
      }
    });

    // Formatear la respuesta
    const formattedOrder = {
      id: updatedOrder.id,
      status: updatedOrder.status,
      payment_method: updatedOrder.payment_method,
      subtotal: updatedOrder.subtotal,
      delivery_fee: updatedOrder.delivery_fee,
      total: updatedOrder.total,
      created_at: updatedOrder.created_at,
      updated_at: updatedOrder.updated_at,
      client: {
        id: updatedOrder.users_orders_id_clientTousers.id,
        name: updatedOrder.users_orders_id_clientTousers.name,
        lastname: updatedOrder.users_orders_id_clientTousers.lastname,
        phone: updatedOrder.users_orders_id_clientTousers.phone
      },
      delivery_address: {
        id: updatedOrder.address.id,
        address: updatedOrder.address.address,
        neighborhood: updatedOrder.address.neighborhood,
        alias: updatedOrder.address.alias
      }
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
          id_delivery: deliveryUserId.toString(),
          status: updatedOrder.status,
          previous_status: currentStatus,
          payment_method: updatedOrder.payment_method,
          subtotal: updatedOrder.subtotal.toString(),
          delivery_fee: updatedOrder.delivery_fee.toString(),
          total: updatedOrder.total.toString(),
          updated_at: updatedOrder.updated_at,
          client: {
            id: updatedOrder.users_orders_id_clientTousers.id,
            name: updatedOrder.users_orders_id_clientTousers.name,
            lastname: updatedOrder.users_orders_id_clientTousers.lastname,
            phone: updatedOrder.users_orders_id_clientTousers.phone
          },
          delivery_address: {
            id: updatedOrder.address.id,
            address: updatedOrder.address.address,
            neighborhood: updatedOrder.address.neighborhood,
            alias: updatedOrder.address.alias
          },
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
      data: {
        order: formattedOrder
      }
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
  getMyAssignedOrders,
  updateOrderStatus
};

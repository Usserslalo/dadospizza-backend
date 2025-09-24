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
          in: ['DESPACHADO', 'EN CAMINO'] // Estados que puede manejar el repartidor
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
        // Información del repartidor asignado
        users_orders_id_deliveryTousers: {
          select: {
            id: true,
            name: true,
            lastname: true,
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

    // Formatear la respuesta para convertir BigInt a string y manejar valores null
    const formattedOrders = assignedOrders.map(order => ({
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
      delivery: order.users_orders_id_deliveryTousers ? {
        id: order.users_orders_id_deliveryTousers.id.toString(),
        name: order.users_orders_id_deliveryTousers.name || '',
        lastname: order.users_orders_id_deliveryTousers.lastname || '',
        phone: order.users_orders_id_deliveryTousers.phone || ''
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
      message: 'Pedidos asignados obtenidos exitosamente',
      data: formattedOrders
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

    // ===== LOGGING DETALLADO PARA DEBUGGING =====
    console.log('=== UPDATE ORDER STATUS - DELIVERY ===');
    console.log('Order ID:', orderId);
    console.log('New Status:', newStatus);
    console.log('User ID (Delivery):', deliveryUserId);

    // Validar que se proporcione el nuevo estado
    if (!newStatus) {
      console.log('❌ ERROR: No se proporcionó el estado');
      return res.status(400).json({
        success: false,
        error: 'El campo status es requerido'
      });
    }

    // Validar que el nuevo estado sea válido para el repartidor
    const validStatuses = ['EN CAMINO', 'ENTREGADO'];
    console.log('=== VALIDACIÓN DE ESTADO ===');
    console.log('Estado recibido:', newStatus);
    console.log('Estados válidos:', validStatuses);
    console.log('¿Estado válido?', validStatuses.includes(newStatus));

    if (!validStatuses.includes(newStatus)) {
      console.log('❌ ERROR: Estado no válido');
      return res.status(400).json({
        success: false,
        error: 'Estado no válido. Los estados permitidos son: EN CAMINO, ENTREGADO'
      });
    }

    // Buscar el pedido por ID
    console.log('=== BUSCANDO PEDIDO ===');
    const existingOrder = await prisma.orders.findUnique({
      where: {
        id: BigInt(orderId)
      }
    });

    console.log('Pedido encontrado:', !!existingOrder);
    if (existingOrder) {
      console.log('Estado actual del pedido:', existingOrder.status);
      console.log('Repartidor asignado:', existingOrder.id_delivery);
      console.log('¿Es el repartidor correcto?', existingOrder.id_delivery === BigInt(deliveryUserId));
    }

    // Verificar que el pedido existe
    if (!existingOrder) {
      console.log('❌ ERROR: Pedido no encontrado');
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenece al repartidor autenticado
    if (existingOrder.id_delivery !== BigInt(deliveryUserId)) {
      console.log('❌ ERROR: El pedido no pertenece al repartidor');
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para actualizar este pedido'
      });
    }

    // Validar transiciones de estado válidas
    const currentStatus = existingOrder.status;
    console.log('=== VALIDACIÓN DE TRANSICIÓN ===');
    console.log('Estado actual:', currentStatus);
    console.log('Estado destino:', newStatus);
    
    const validTransitions = {
      'DESPACHADO': ['EN CAMINO'],
      'EN CAMINO': ['ENTREGADO']
    };
    console.log('Transiciones válidas:', validTransitions);
    
    let isValidTransition = false;
    if (currentStatus === 'DESPACHADO' && newStatus === 'EN CAMINO') {
      isValidTransition = true;
    } else if (currentStatus === 'EN CAMINO' && newStatus === 'ENTREGADO') {
      isValidTransition = true;
    }
    
    console.log('¿Transición válida?', isValidTransition);

    if (!isValidTransition) {
      console.log('❌ ERROR: Transición de estado no válida');
      return res.status(400).json({
        success: false,
        error: 'Transición de estado no válida',
        details: {
          current_status: currentStatus,
          requested_status: newStatus,
          valid_transitions: validTransitions
        }
      });
    }

    console.log('✅ Todas las validaciones pasaron, procediendo a actualizar...');

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

    console.log('✅ Pedido actualizado exitosamente');

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

// src/controllers/orders.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc Crear un nuevo pedido con cálculo de precios en el servidor
 * @route POST /api/orders
 * @access Private
 */
const createOrder = async (req, res) => {
  try {
    // a) Autenticación y Validación Inicial
    const userId = req.user.userId;
    const { id_address, id_branch, payment_method, products } = req.body;

    // Validar campos requeridos
    if (!id_address || !id_branch || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'Campos requeridos: id_address, id_branch y products (array no vacío)'
      });
    }

    // b) Cálculo de Precios en el Servidor (Lógica Crítica)
    let subtotal = 0;
    const processedProducts = [];

    // Iterar sobre cada producto en el array
    for (const item of products) {
      const { id_product, quantity, id_size, addons = [] } = item;

      // Validar campos del producto
      if (!id_product || !quantity || quantity <= 0) {
        return res.status(400).json({
          error: 'Cada producto debe tener id_product y quantity válidos'
        });
      }

      // Buscar el producto en la base de datos
      const product = await prisma.products.findUnique({
        where: { id: BigInt(id_product) },
        include: { categories: true }
      });

      if (!product || !product.is_available) {
        return res.status(400).json({
          error: `Producto con ID ${id_product} no encontrado o no disponible`
        });
      }

      // Calcular precio unitario del producto
      let unitPrice = 0;

      if (product.price !== null) {
        // Producto con precio fijo (bebidas, Megamix)
        unitPrice = parseFloat(product.price);
      } else {
        // Producto con precio variable (pizzas) - buscar en category_prices
        if (!id_size) {
          return res.status(400).json({
            error: `El producto ${product.name} requiere especificar un tamaño (id_size)`
          });
        }

        const categoryPrice = await prisma.category_prices.findUnique({
          where: {
            id_category_id_size: {
              id_category: product.id_category,
              id_size: BigInt(id_size)
            }
          }
        });

        if (!categoryPrice) {
          return res.status(400).json({
            error: `No se encontró precio para el producto ${product.name} con el tamaño especificado`
          });
        }

        unitPrice = parseFloat(categoryPrice.price);
      }

      // Calcular precio total de addons
      let addonsPriceTotal = 0;
      const processedAddons = [];

      if (addons && addons.length > 0) {
        for (const addonId of addons) {
          // Verificar que el addon existe
          const addon = await prisma.addons.findUnique({
            where: { id: BigInt(addonId) }
          });

          if (!addon) {
            return res.status(400).json({
              error: `Addon con ID ${addonId} no encontrado`
            });
          }

          // Buscar precio del addon para el tamaño especificado
          const addonPrice = await prisma.addon_prices.findUnique({
            where: {
              id_addon_id_size: {
                id_addon: BigInt(addonId),
                id_size: BigInt(id_size)
              }
            }
          });

          if (!addonPrice) {
            return res.status(400).json({
              error: `No se encontró precio para el addon ${addon.name} con el tamaño especificado`
            });
          }

          const addonPriceValue = parseFloat(addonPrice.price);
          addonsPriceTotal += addonPriceValue;
          processedAddons.push({
            id_addon: addonId,
            price_at_purchase: addonPriceValue
          });
        }
      }

      // Calcular precio final por unidad
      const pricePerUnit = unitPrice + addonsPriceTotal;

      // Actualizar subtotal
      subtotal += pricePerUnit * quantity;

      // Guardar producto procesado
      processedProducts.push({
        id_product,
        quantity,
        id_size: id_size || null,
        price_per_unit: pricePerUnit,
        addons: processedAddons
      });
    }

    // c) Transacción Atómica de Base de Datos
    const result = await prisma.$transaction(async (tx) => {
      // Crear el registro en la tabla orders
      const deliveryFee = 0; // Por ahora asumimos 0
      const total = subtotal + deliveryFee;

      const order = await tx.orders.create({
        data: {
          id_client: BigInt(userId),
          id_address: BigInt(id_address),
          id_branch: BigInt(id_branch),
          status: 'PAGADO',
          payment_method: payment_method || 'Efectivo',
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Crear registros en order_has_products y order_item_addons
      const orderItems = [];

      for (const processedProduct of processedProducts) {
        // Crear registro en order_has_products
        const orderItem = await tx.order_has_products.create({
          data: {
            id_order: order.id,
            id_product: BigInt(processedProduct.id_product),
            id_size: processedProduct.id_size ? BigInt(processedProduct.id_size) : null,
            quantity: processedProduct.quantity,
            price_per_unit: processedProduct.price_per_unit,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        orderItems.push(orderItem);

        // Crear registros en order_item_addons si hay addons
        if (processedProduct.addons && processedProduct.addons.length > 0) {
          for (const addon of processedProduct.addons) {
            await tx.order_item_addons.create({
              data: {
                id_order_has_product: orderItem.id,
                id_addon: BigInt(addon.id_addon),
                price_at_purchase: addon.price_at_purchase
              }
            });
          }
        }
      }

      return {
        order,
        orderItems
      };
    });

    // d) Emitir notificación en tiempo real a la sucursal
    try {
      const io = global.io;
      if (io) {
        const branchRoom = `branch_${result.order.id_branch.toString()}`;
        
        // Preparar datos del pedido para la notificación
        const orderNotification = {
          id: result.order.id.toString(),
          id_client: result.order.id_client.toString(),
          id_branch: result.order.id_branch.toString(),
          status: result.order.status,
          payment_method: result.order.payment_method,
          subtotal: result.order.subtotal.toString(),
          delivery_fee: result.order.delivery_fee.toString(),
          total: result.order.total.toString(),
          created_at: result.order.created_at,
          products_count: result.orderItems.length,
          timestamp: new Date().toISOString()
        };

        // Emitir evento a la sala de la sucursal
        io.to(branchRoom).emit('nuevo_pedido', orderNotification);
        console.log(`📢 Notificación 'nuevo_pedido' enviada a la sala: ${branchRoom}`);
      }
    } catch (socketError) {
      console.error('Error al emitir notificación de nuevo pedido:', socketError);
      // No fallar la operación si hay error en Socket.IO
    }

    // e) Respuesta Exitosa
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: {
        order_id: result.order.id.toString(),
        subtotal: result.order.subtotal.toString(),
        delivery_fee: result.order.delivery_fee.toString(),
        total: result.order.total.toString(),
        status: result.order.status,
        payment_method: result.order.payment_method,
        products_count: result.orderItems.length,
        created_at: result.order.created_at
      }
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Error de duplicación en la base de datos'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Referencia a registro inexistente (dirección, sucursal o producto)'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor al crear el pedido',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * @desc Obtener el historial de pedidos del usuario autenticado
 * @route GET /api/orders/my-history
 * @access Private (requiere autenticación y rol CLIENTE)
 */
const getMyOrders = async (req, res) => {
  try {
    // Obtener el ID del usuario autenticado
    const userId = req.user.userId;

    // Consultar todos los pedidos del usuario con toda la información relacionada
    const orders = await prisma.orders.findMany({
      where: {
        id_client: BigInt(userId)
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        address: true,  // Incluir los detalles de la dirección de entrega
        branches: true, // Incluir los detalles de la sucursal
        order_has_products: {
          include: {
            products: true, // Dentro de cada producto del pedido, incluir los detalles del producto
            sizes: true,    // Incluir el nombre del tamaño si aplica (ej. "Grande")
            order_item_addons: {
              include: {
                addons: true // Dentro de cada addon del item, incluir los detalles del addon
              }
            }
          }
        }
      }
    });

    // Formatear la respuesta para que sea más legible
    const formattedOrders = orders.map(order => ({
      id: order.id.toString(),
      status: order.status,
      payment_method: order.payment_method,
      subtotal: order.subtotal.toString(),
      delivery_fee: order.delivery_fee.toString(),
      total: order.total.toString(),
      created_at: order.created_at,
      updated_at: order.updated_at,
      address: {
        id: order.address.id.toString(),
        address: order.address.address,
        neighborhood: order.address.neighborhood,
        alias: order.address.alias,
        lat: order.address.lat,
        lng: order.address.lng
      },
      branches: {
        id: order.branches.id.toString(),
        name: order.branches.name,
        address: order.branches.address,
        phone: order.branches.phone
      },
      order_has_products: order.order_has_products.map(item => ({
        id: item.id.toString(),
        quantity: item.quantity,
        price_per_unit: item.price_per_unit.toString(),
        products: {
          id: item.products.id.toString(),
          name: item.products.name,
          description: item.products.description
        },
        sizes: item.sizes ? {
          id: item.sizes.id.toString(),
          name: item.sizes.name
        } : null,
        order_item_addons: item.order_item_addons.map(addon => ({
          id: addon.id.toString(),
          price_at_purchase: addon.price_at_purchase.toString(),
          addons: {
            id: addon.addons.id.toString(),
            name: addon.addons.name
          }
        }))
      }))
    }));

    res.status(200).json({
      success: true,
      message: 'Historial de pedidos obtenido exitosamente',
      data: formattedOrders,
      count: formattedOrders.length
    });

  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Error de duplicación en la base de datos'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor al obtener el historial de pedidos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  createOrder,
  getMyOrders
};

// test-restaurant-orders-endpoint.js
// Script para probar el endpoint GET /api/restaurant/orders y identificar campos null

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRestaurantOrdersEndpoint() {
  try {
    console.log('🔍 PROBANDO ENDPOINT GET /api/restaurant/orders\n');
    console.log('=' .repeat(70));

    // 1. Buscar un usuario con rol RESTAURANTE
    console.log('\n👤 1. BUSCANDO USUARIO CON ROL RESTAURANTE:');
    const restaurantUser = await prisma.users.findFirst({
      where: {
        user_has_roles: {
          some: {
            roles: { name: 'RESTAURANTE' }
          }
        }
      },
      include: {
        user_has_roles: {
          include: { roles: true }
        },
        branches: true
      }
    });

    if (!restaurantUser) {
      console.log('❌ No se encontró usuario con rol RESTAURANTE');
      return;
    }

    console.log(`✅ Usuario encontrado: ${restaurantUser.name} ${restaurantUser.lastname}`);
    console.log(`   Email: ${restaurantUser.email}`);
    console.log(`   Sucursal: ${restaurantUser.branches?.name || 'Sin asignar'}`);
    console.log(`   ID Sucursal: ${restaurantUser.id_branch || 'null'}`);

    // 2. Simular la lógica del endpoint getOrdersByStatus
    console.log('\n📋 2. SIMULANDO LÓGICA DEL ENDPOINT:');
    
    const whereCondition = {
      id_branch: restaurantUser.id_branch
    };

    console.log('Condición WHERE:', whereCondition);

    // 3. Buscar pedidos con la misma lógica del controlador
    console.log('\n🔍 3. BUSCANDO PEDIDOS CON INCLUDE COMPLETO:');
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

    console.log(`✅ Pedidos encontrados: ${orders.length}`);

    // 4. Analizar cada pedido y identificar campos null
    console.log('\n🔍 4. ANALIZANDO CAMPOS NULL EN CADA PEDIDO:');
    
    orders.forEach((order, index) => {
      console.log(`\n--- PEDIDO ${index + 1} (ID: ${order.id}) ---`);
      
      // Campos principales
      console.log('📊 CAMPOS PRINCIPALES:');
      console.log(`  id: ${order.id} (tipo: ${typeof order.id})`);
      console.log(`  id_client: ${order.id_client} (tipo: ${typeof order.id_client})`);
      console.log(`  id_delivery: ${order.id_delivery} (tipo: ${typeof order.id_delivery}) ${order.id_delivery === null ? '⚠️ NULL' : ''}`);
      console.log(`  id_address: ${order.id_address} (tipo: ${typeof order.id_address})`);
      console.log(`  id_branch: ${order.id_branch} (tipo: ${typeof order.id_branch})`);
      console.log(`  status: ${order.status} (tipo: ${typeof order.status}) ${order.status === null ? '⚠️ NULL' : ''}`);
      console.log(`  payment_method: ${order.payment_method} (tipo: ${typeof order.payment_method}) ${order.payment_method === null ? '⚠️ NULL' : ''}`);
      console.log(`  subtotal: ${order.subtotal} (tipo: ${typeof order.subtotal}) ${order.subtotal === null ? '⚠️ NULL' : ''}`);
      console.log(`  delivery_fee: ${order.delivery_fee} (tipo: ${typeof order.delivery_fee}) ${order.delivery_fee === null ? '⚠️ NULL' : ''}`);
      console.log(`  total: ${order.total} (tipo: ${typeof order.total}) ${order.total === null ? '⚠️ NULL' : ''}`);
      console.log(`  created_at: ${order.created_at} (tipo: ${typeof order.created_at}) ${order.created_at === null ? '⚠️ NULL' : ''}`);
      console.log(`  updated_at: ${order.updated_at} (tipo: ${typeof order.updated_at}) ${order.updated_at === null ? '⚠️ NULL' : ''}`);

      // Campos relacionados
      console.log('\n👤 CAMPOS RELACIONADOS:');
      console.log(`  client: ${order.users_orders_id_clientTousers ? 'Presente' : '⚠️ NULL'}`);
      if (order.users_orders_id_clientTousers) {
        console.log(`    - name: ${order.users_orders_id_clientTousers.name} (tipo: ${typeof order.users_orders_id_clientTousers.name})`);
        console.log(`    - lastname: ${order.users_orders_id_clientTousers.lastname} (tipo: ${typeof order.users_orders_id_clientTousers.lastname})`);
        console.log(`    - phone: ${order.users_orders_id_clientTousers.phone} (tipo: ${typeof order.users_orders_id_clientTousers.phone})`);
        console.log(`    - email: ${order.users_orders_id_clientTousers.email} (tipo: ${typeof order.users_orders_id_clientTousers.email})`);
      }

      console.log(`  address: ${order.address ? 'Presente' : '⚠️ NULL'}`);
      if (order.address) {
        console.log(`    - address: ${order.address.address} (tipo: ${typeof order.address.address})`);
        console.log(`    - neighborhood: ${order.address.neighborhood} (tipo: ${typeof order.address.neighborhood})`);
        console.log(`    - alias: ${order.address.alias} (tipo: ${typeof order.address.alias}) ${order.address.alias === null ? '⚠️ NULL' : ''}`);
        console.log(`    - lat: ${order.address.lat} (tipo: ${typeof order.address.lat}) ${order.address.lat === null ? '⚠️ NULL' : ''}`);
        console.log(`    - lng: ${order.address.lng} (tipo: ${typeof order.address.lng}) ${order.address.lng === null ? '⚠️ NULL' : ''}`);
      }

      console.log(`  branch: ${order.branches ? 'Presente' : '⚠️ NULL'}`);
      if (order.branches) {
        console.log(`    - name: ${order.branches.name} (tipo: ${typeof order.branches.name})`);
        console.log(`    - address: ${order.branches.address} (tipo: ${typeof order.branches.address})`);
        console.log(`    - phone: ${order.branches.phone} (tipo: ${typeof order.branches.phone}) ${order.branches.phone === null ? '⚠️ NULL' : ''}`);
      }

      console.log(`  products: ${order.order_has_products ? `Array con ${order.order_has_products.length} items` : '⚠️ NULL'}`);
    });

    // 5. Simular el formateo que hace el controlador
    console.log('\n🔄 5. SIMULANDO FORMATEO DEL CONTROLADOR:');
    
    const formattedOrders = orders.map(order => {
      try {
        return {
          id: order.id.toString(),
          id_client: order.id_client.toString(),
          id_delivery: order.id_delivery ? order.id_delivery.toString() : null,
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
        };
      } catch (error) {
        console.log(`❌ Error formateando pedido ${order.id}:`, error.message);
        return null;
      }
    });

    console.log(`✅ Pedidos formateados: ${formattedOrders.filter(o => o !== null).length}`);

    // 6. Verificar campos problemáticos en el formato final
    console.log('\n⚠️ 6. VERIFICANDO CAMPOS PROBLEMÁTICOS EN FORMATO FINAL:');
    
    formattedOrders.forEach((order, index) => {
      if (!order) return;
      
      console.log(`\n--- PEDIDO FORMATEADO ${index + 1} ---`);
      
      // Verificar campos que pueden causar el error
      const problematicFields = [];
      
      if (order.id === null || order.id === undefined) problematicFields.push('id');
      if (order.status === null || order.status === undefined) problematicFields.push('status');
      if (order.payment_method === null || order.payment_method === undefined) problematicFields.push('payment_method');
      if (order.total === null || order.total === undefined) problematicFields.push('total');
      if (order.subtotal === null || order.subtotal === undefined) problematicFields.push('subtotal');
      if (order.delivery_fee === null || order.delivery_fee === undefined) problematicFields.push('delivery_fee');
      if (order.created_at === null || order.created_at === undefined) problematicFields.push('created_at');
      if (order.updated_at === null || order.updated_at === undefined) problematicFields.push('updated_at');
      
      if (problematicFields.length > 0) {
        console.log(`❌ CAMPOS PROBLEMÁTICOS: ${problematicFields.join(', ')}`);
      } else {
        console.log(`✅ Todos los campos principales están presentes`);
      }
    });

    // 7. Mostrar respuesta final simulada
    console.log('\n📤 7. RESPUESTA FINAL SIMULADA:');
    console.log(JSON.stringify({
      success: true,
      message: 'Pedidos obtenidos exitosamente',
      data: formattedOrders.slice(0, 1) // Solo mostrar el primer pedido para no saturar
    }, null, 2));

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRestaurantOrdersEndpoint();

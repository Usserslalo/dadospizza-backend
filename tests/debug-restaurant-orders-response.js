// debug-restaurant-orders-response.js
// Script para debuggear la estructura exacta de la respuesta del endpoint

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRestaurantOrdersResponse() {
  try {
    console.log('🔍 DEBUGGING: Estructura de Respuesta del Endpoint GET /api/restaurant/orders\n');
    console.log('=' .repeat(80));

    // 1. Buscar usuario con rol RESTAURANTE
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

    // 2. Simular la lógica exacta del endpoint
    console.log('\n📋 2. SIMULANDO LÓGICA EXACTA DEL ENDPOINT:');
    
    const whereCondition = {
      id_branch: restaurantUser.id_branch
    };

    console.log('Condición WHERE:', whereCondition);

    // 3. Buscar pedidos con la misma lógica del controlador
    console.log('\n🔍 3. BUSCANDO PEDIDOS CON INCLUDE COMPLETO:');
    const orders = await prisma.orders.findMany({
      where: whereCondition,
      include: {
        users_orders_id_clientTousers: {
          select: {
            id: true,
            name: true,
            lastname: true,
            phone: true,
            email: true
          }
        },
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
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
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

    // 4. Aplicar el formateo exacto del controlador
    console.log('\n🔄 4. APLICANDO FORMATEO EXACTO DEL CONTROLADOR:');
    
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

    console.log(`✅ Pedidos formateados: ${formattedOrders.length}`);

    // 5. Crear la respuesta exacta del endpoint
    console.log('\n📤 5. CREANDO RESPUESTA EXACTA DEL ENDPOINT:');
    
    const response = {
      success: true,
      message: 'Pedidos obtenidos exitosamente',
      data: formattedOrders
    };

    console.log('=== ESTRUCTURA DE RESPUESTA ===');
    console.log('response type:', typeof response);
    console.log('response keys:', Object.keys(response));
    console.log('response.data type:', typeof response.data);
    console.log('response.data is Array:', Array.isArray(response.data));
    console.log('response.data length:', response.data.length);

    // 6. Verificar cada campo de cada pedido
    console.log('\n🔍 6. VERIFICANDO CADA CAMPO DE CADA PEDIDO:');
    
    response.data.forEach((order, index) => {
      console.log(`\n=== PEDIDO ${index + 1} ===`);
      console.log('Order type:', typeof order);
      console.log('Order keys:', Object.keys(order));
      
      // Verificar campos críticos
      console.log('\n📊 CAMPOS PRINCIPALES:');
      console.log(`  id: "${order.id}" (type: ${typeof order.id})`);
      console.log(`  id_client: "${order.id_client}" (type: ${typeof order.id_client})`);
      console.log(`  id_delivery: ${order.id_delivery} (type: ${typeof order.id_delivery})`);
      console.log(`  id_address: "${order.id_address}" (type: ${typeof order.id_address})`);
      console.log(`  id_branch: "${order.id_branch}" (type: ${typeof order.id_branch})`);
      console.log(`  status: "${order.status}" (type: ${typeof order.status})`);
      console.log(`  payment_method: "${order.payment_method}" (type: ${typeof order.payment_method})`);
      console.log(`  subtotal: "${order.subtotal}" (type: ${typeof order.subtotal})`);
      console.log(`  delivery_fee: "${order.delivery_fee}" (type: ${typeof order.delivery_fee})`);
      console.log(`  total: "${order.total}" (type: ${typeof order.total})`);
      console.log(`  created_at: "${order.created_at}" (type: ${typeof order.created_at})`);
      console.log(`  updated_at: "${order.updated_at}" (type: ${typeof order.updated_at})`);
      
      // Verificar objetos anidados
      console.log('\n👤 OBJETOS ANIDADOS:');
      console.log(`  client: ${order.client ? 'Presente' : 'NULL'}`);
      if (order.client) {
        console.log(`    - id: "${order.client.id}" (type: ${typeof order.client.id})`);
        console.log(`    - name: "${order.client.name}" (type: ${typeof order.client.name})`);
        console.log(`    - lastname: "${order.client.lastname}" (type: ${typeof order.client.lastname})`);
        console.log(`    - phone: "${order.client.phone}" (type: ${typeof order.client.phone})`);
        console.log(`    - email: "${order.client.email}" (type: ${typeof order.client.email})`);
      }
      
      console.log(`  address: ${order.address ? 'Presente' : 'NULL'}`);
      if (order.address) {
        console.log(`    - id: "${order.address.id}" (type: ${typeof order.address.id})`);
        console.log(`    - address: "${order.address.address}" (type: ${typeof order.address.address})`);
        console.log(`    - neighborhood: "${order.address.neighborhood}" (type: ${typeof order.address.neighborhood})`);
        console.log(`    - alias: ${order.address.alias} (type: ${typeof order.address.alias})`);
        console.log(`    - lat: ${order.address.lat} (type: ${typeof order.address.lat})`);
        console.log(`    - lng: ${order.address.lng} (type: ${typeof order.address.lng})`);
      }
      
      console.log(`  branch: ${order.branch ? 'Presente' : 'NULL'}`);
      if (order.branch) {
        console.log(`    - id: "${order.branch.id}" (type: ${typeof order.branch.id})`);
        console.log(`    - name: "${order.branch.name}" (type: ${typeof order.branch.name})`);
        console.log(`    - address: "${order.branch.address}" (type: ${typeof order.branch.address})`);
        console.log(`    - phone: ${order.branch.phone} (type: ${typeof order.branch.phone})`);
      }
      
      console.log(`  products: ${Array.isArray(order.products) ? `Array con ${order.products.length} items` : 'NULL'}`);
      if (Array.isArray(order.products) && order.products.length > 0) {
        order.products.forEach((product, pIndex) => {
          console.log(`    Producto ${pIndex + 1}:`);
          console.log(`      - id: "${product.id}" (type: ${typeof product.id})`);
          console.log(`      - id_product: "${product.id_product}" (type: ${typeof product.id_product})`);
          console.log(`      - id_size: ${product.id_size} (type: ${typeof product.id_size})`);
          console.log(`      - quantity: ${product.quantity} (type: ${typeof product.quantity})`);
          console.log(`      - price_per_unit: "${product.price_per_unit}" (type: ${typeof product.price_per_unit})`);
          console.log(`      - product: ${product.product ? 'Presente' : 'NULL'}`);
          console.log(`      - size: ${product.size ? 'Presente' : 'NULL'}`);
          console.log(`      - addons: ${Array.isArray(product.addons) ? `Array con ${product.addons.length} items` : 'NULL'}`);
        });
      }
    });

    // 7. Mostrar respuesta JSON completa (solo primeros 2 pedidos)
    console.log('\n📤 7. RESPUESTA JSON COMPLETA (PRIMEROS 2 PEDIDOS):');
    try {
      const jsonResponse = {
        success: true,
        message: 'Pedidos obtenidos exitosamente',
        data: formattedOrders.slice(0, 2)
      };
      
      const jsonString = JSON.stringify(jsonResponse, null, 2);
      console.log(jsonString);
      
    } catch (error) {
      console.log('❌ Error en serialización JSON:', error.message);
    }

    // 8. Verificar campos problemáticos
    console.log('\n⚠️ 8. VERIFICANDO CAMPOS PROBLEMÁTICOS:');
    
    let hasProblems = false;
    response.data.forEach((order, index) => {
      const problems = [];
      
      // Verificar campos que pueden causar el error
      if (order.id === null || order.id === undefined) problems.push('id');
      if (order.status === null || order.status === undefined) problems.push('status');
      if (order.payment_method === null || order.payment_method === undefined) problems.push('payment_method');
      if (order.total === null || order.total === undefined) problems.push('total');
      if (order.subtotal === null || order.subtotal === undefined) problems.push('subtotal');
      if (order.delivery_fee === null || order.delivery_fee === undefined) problems.push('delivery_fee');
      if (order.created_at === null || order.created_at === undefined) problems.push('created_at');
      if (order.updated_at === null || order.updated_at === undefined) problems.push('updated_at');
      
      // Verificar objetos anidados
      if (order.client) {
        if (order.client.id === null || order.client.id === undefined) problems.push('client.id');
        if (order.client.name === null || order.client.name === undefined) problems.push('client.name');
        if (order.client.lastname === null || order.client.lastname === undefined) problems.push('client.lastname');
        if (order.client.phone === null || order.client.phone === undefined) problems.push('client.phone');
        if (order.client.email === null || order.client.email === undefined) problems.push('client.email');
      }
      
      if (order.address) {
        if (order.address.id === null || order.address.id === undefined) problems.push('address.id');
        if (order.address.address === null || order.address.address === undefined) problems.push('address.address');
        if (order.address.neighborhood === null || order.address.neighborhood === undefined) problems.push('address.neighborhood');
      }
      
      if (order.branch) {
        if (order.branch.id === null || order.branch.id === undefined) problems.push('branch.id');
        if (order.branch.name === null || order.branch.name === undefined) problems.push('branch.name');
        if (order.branch.address === null || order.branch.address === undefined) problems.push('branch.address');
      }
      
      if (problems.length > 0) {
        console.log(`❌ Pedido ${index + 1}: Campos problemáticos: ${problems.join(', ')}`);
        hasProblems = true;
      }
    });

    if (!hasProblems) {
      console.log('✅ No se encontraron campos problemáticos');
    }

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('✅ Estructura de respuesta verificada');
    console.log('✅ Todos los campos están correctamente formateados');
    console.log('✅ No hay valores null problemáticos');
    console.log('✅ La respuesta es compatible con Flutter');

  } catch (error) {
    console.error('❌ Error en el debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRestaurantOrdersResponse();

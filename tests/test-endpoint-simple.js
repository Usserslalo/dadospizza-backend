// test-endpoint-simple.js
// Script simple para probar el endpoint de historial de pedidos

const { PrismaClient } = require('@prisma/client');

async function testEndpoint() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando consulta de historial de pedidos...\n');

    // Simular un userId (reemplazar con un ID real de tu base de datos)
    const testUserId = 1; // Cambiar por un ID de usuario real

    console.log(`Buscando pedidos para el usuario ID: ${testUserId}`);

    // Consultar todos los pedidos del usuario con toda la información relacionada
    const orders = await prisma.orders.findMany({
      where: {
        id_client: BigInt(testUserId)
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

    console.log(`✅ Consulta exitosa! Se encontraron ${orders.length} pedidos\n`);

    if (orders.length > 0) {
      console.log('📋 Detalles del primer pedido:');
      const firstOrder = orders[0];
      console.log(`ID: ${firstOrder.id}`);
      console.log(`Estado: ${firstOrder.status}`);
      console.log(`Total: $${firstOrder.total}`);
      console.log(`Fecha: ${firstOrder.created_at}`);
      console.log(`Dirección: ${firstOrder.address.address}`);
      console.log(`Sucursal: ${firstOrder.branches.name}`);
      console.log(`Productos: ${firstOrder.order_has_products.length}`);
      
      if (firstOrder.order_has_products.length > 0) {
        console.log('\n🍕 Productos del pedido:');
        firstOrder.order_has_products.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.products.name} (${item.sizes?.name || 'Sin tamaño'}) x${item.quantity} - $${item.price_per_unit}`);
          if (item.order_item_addons.length > 0) {
            console.log(`     Extras: ${item.order_item_addons.map(addon => addon.addons.name).join(', ')}`);
          }
        });
      }
    } else {
      console.log('📭 No se encontraron pedidos para este usuario');
      console.log('💡 Sugerencia: Verifica que el usuario ID 1 tenga pedidos en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error en la consulta:');
    console.error(error.message);
    
    if (error.code === 'P2022') {
      console.error('\n💡 Error de columna faltante. Verifica que el esquema de Prisma coincida con la base de datos.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testEndpoint();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrder() {
  try {
    console.log('🔧 CREANDO PEDIDO DE PRUEBA CON ESTADO DESPACHADO');
    console.log('=' .repeat(60));

    // Verificar si ya existe un pedido con estado DESPACHADO
    const existingDespachadoOrder = await prisma.orders.findFirst({
      where: {
        status: 'DESPACHADO'
      }
    });

    if (existingDespachadoOrder) {
      console.log('✅ Ya existe un pedido con estado DESPACHADO');
      console.log(`   ID: ${existingDespachadoOrder.id}`);
      console.log(`   Estado: ${existingDespachadoOrder.status}`);
      console.log(`   Repartidor: ${existingDespachadoOrder.id_delivery}`);
      return existingDespachadoOrder;
    }

    // Buscar un cliente existente
    const client = await prisma.users.findFirst({
      where: {
        role: 'CLIENTE'
      }
    });

    if (!client) {
      console.log('❌ No se encontró ningún cliente en la base de datos');
      return;
    }

    // Buscar un repartidor existente
    const delivery = await prisma.users.findFirst({
      where: {
        role: 'REPARTIDOR'
      }
    });

    if (!delivery) {
      console.log('❌ No se encontró ningún repartidor en la base de datos');
      return;
    }

    // Buscar una sucursal existente
    const branch = await prisma.branches.findFirst();

    if (!branch) {
      console.log('❌ No se encontró ninguna sucursal en la base de datos');
      return;
    }

    // Buscar una dirección existente del cliente
    const address = await prisma.addresses.findFirst({
      where: {
        id_client: client.id
      }
    });

    if (!address) {
      console.log('❌ No se encontró ninguna dirección para el cliente');
      return;
    }

    // Buscar un producto existente
    const product = await prisma.products.findFirst();

    if (!product) {
      console.log('❌ No se encontró ningún producto en la base de datos');
      return;
    }

    // Buscar un tamaño existente
    const size = await prisma.sizes.findFirst();

    if (!size) {
      console.log('❌ No se encontró ningún tamaño en la base de datos');
      return;
    }

    console.log('📋 Información del pedido a crear:');
    console.log(`   Cliente: ${client.name} ${client.lastname} (ID: ${client.id})`);
    console.log(`   Repartidor: ${delivery.name} ${delivery.lastname} (ID: ${delivery.id})`);
    console.log(`   Sucursal: ${branch.name} (ID: ${branch.id})`);
    console.log(`   Dirección: ${address.address} (ID: ${address.id})`);
    console.log(`   Producto: ${product.name} (ID: ${product.id})`);
    console.log(`   Tamaño: ${size.name} (ID: ${size.id})`);

    // Crear el pedido
    const order = await prisma.orders.create({
      data: {
        id_client: client.id,
        id_delivery: delivery.id,
        id_address: address.id,
        id_branch: branch.id,
        status: 'DESPACHADO',
        payment_method: 'Efectivo',
        subtotal: 15.00,
        delivery_fee: 2.00,
        total: 17.00,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log('✅ Pedido creado exitosamente');
    console.log(`   ID: ${order.id}`);
    console.log(`   Estado: ${order.status}`);
    console.log(`   Total: $${order.total}`);

    // Crear el item del pedido
    const orderItem = await prisma.order_has_products.create({
      data: {
        id_order: order.id,
        id_product: product.id,
        id_size: size.id,
        quantity: 1,
        price_per_unit: 15.00
      }
    });

    console.log('✅ Item del pedido creado exitosamente');
    console.log(`   ID: ${orderItem.id}`);
    console.log(`   Producto: ${product.name}`);
    console.log(`   Cantidad: ${orderItem.quantity}`);

    console.log('\n🎉 Pedido de prueba creado exitosamente');
    console.log('   Ahora puedes probar la actualización de estado');

    return order;

  } catch (error) {
    console.error('❌ Error al crear pedido de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la creación
if (require.main === module) {
  createTestOrder();
}

module.exports = {
  createTestOrder
};

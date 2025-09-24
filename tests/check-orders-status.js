const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrdersStatus() {
  try {
    console.log('🔍 VERIFICANDO ESTADO DE PEDIDOS EN LA BASE DE DATOS');
    console.log('=' .repeat(60));

    // Obtener todos los pedidos con sus estados
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        status: true,
        id_delivery: true,
        id_client: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`\n📊 Total de pedidos en la base de datos: ${orders.length}`);

    if (orders.length === 0) {
      console.log('⚠️  No hay pedidos en la base de datos');
      return;
    }

    // Agrupar por estado
    const statusCounts = {};
    orders.forEach(order => {
      const status = order.status || 'SIN_ESTADO';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Distribución por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} pedidos`);
    });

    // Mostrar pedidos con estado DESPACHADO (que pueden ser actualizados por repartidores)
    const despachadoOrders = orders.filter(order => order.status === 'DESPACHADO');
    console.log(`\n🚚 Pedidos con estado DESPACHADO (${despachadoOrders.length}):`);
    despachadoOrders.forEach(order => {
      console.log(`   ID: ${order.id}, Repartidor: ${order.id_delivery}, Cliente: ${order.id_client}`);
    });

    // Mostrar pedidos con estado EN CAMINO
    const enCaminoOrders = orders.filter(order => order.status === 'EN CAMINO');
    console.log(`\n🚛 Pedidos con estado EN CAMINO (${enCaminoOrders.length}):`);
    enCaminoOrders.forEach(order => {
      console.log(`   ID: ${order.id}, Repartidor: ${order.id_delivery}, Cliente: ${order.id_client}`);
    });

    // Mostrar pedidos con estado ENTREGADO
    const entregadoOrders = orders.filter(order => order.status === 'ENTREGADO');
    console.log(`\n✅ Pedidos con estado ENTREGADO (${entregadoOrders.length}):`);
    entregadoOrders.forEach(order => {
      console.log(`   ID: ${order.id}, Repartidor: ${order.id_delivery}, Cliente: ${order.id_client}`);
    });

    // Verificar si hay repartidores asignados
    const ordersWithDelivery = orders.filter(order => order.id_delivery !== null);
    console.log(`\n👨‍💼 Pedidos con repartidor asignado: ${ordersWithDelivery.length}`);

    // Mostrar los últimos 10 pedidos
    console.log('\n📋 Últimos 10 pedidos:');
    orders.slice(0, 10).forEach((order, index) => {
      console.log(`   ${index + 1}. ID: ${order.id}, Estado: ${order.status || 'SIN_ESTADO'}, Repartidor: ${order.id_delivery || 'SIN_ASIGNAR'}`);
    });

    console.log('\n🎉 Verificación completada');

  } catch (error) {
    console.error('❌ Error al verificar pedidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
if (require.main === module) {
  checkOrdersStatus();
}

module.exports = {
  checkOrdersStatus
};

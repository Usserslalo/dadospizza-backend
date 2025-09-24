const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignSpecificOrder() {
  try {
    console.log('🔄 REASIGNANDO PEDIDO ESPECÍFICO AL REPARTIDOR DE PRUEBA');
    console.log('=' .repeat(60));

    // Buscar el repartidor de prueba
    const repartidor = await prisma.users.findFirst({
      where: {
        email: 'repartidor@test.com'
      }
    });

    if (!repartidor) {
      console.log('❌ No se encontró el repartidor de prueba');
      return;
    }

    console.log(`✅ Repartidor encontrado: ${repartidor.name} ${repartidor.lastname} (ID: ${repartidor.id})`);

    // Reasignar el pedido ID 6 al repartidor de prueba
    const pedidoId = 6;
    
    const pedido = await prisma.orders.findUnique({
      where: {
        id: pedidoId
      },
      select: {
        id: true,
        status: true,
        id_delivery: true,
        id_client: true
      }
    });

    if (!pedido) {
      console.log(`❌ No se encontró el pedido ID ${pedidoId}`);
      return;
    }

    console.log(`📦 Pedido encontrado: ID ${pedido.id}, Estado: ${pedido.status}, Repartidor actual: ${pedido.id_delivery}`);

    // Reasignar el pedido al repartidor de prueba
    await prisma.orders.update({
      where: {
        id: pedidoId
      },
      data: {
        id_delivery: repartidor.id,
        updated_at: new Date()
      }
    });

    console.log(`✅ Pedido ${pedidoId} reasignado al repartidor de prueba`);

    // Verificar la reasignación
    const pedidoReasignado = await prisma.orders.findUnique({
      where: {
        id: pedidoId
      },
      select: {
        id: true,
        status: true,
        id_delivery: true,
        id_client: true
      }
    });

    console.log(`\n✅ Verificación de reasignación:`);
    console.log(`   ID: ${pedidoReasignado.id}`);
    console.log(`   Estado: ${pedidoReasignado.status}`);
    console.log(`   Repartidor: ${pedidoReasignado.id_delivery}`);
    console.log(`   Cliente: ${pedidoReasignado.id_client}`);

    console.log('\n🎉 Reasignación completada exitosamente');

  } catch (error) {
    console.error('❌ Error al reasignar pedido:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la reasignación
if (require.main === module) {
  reassignSpecificOrder();
}

module.exports = {
  reassignSpecificOrder
};

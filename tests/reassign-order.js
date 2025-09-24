const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignOrder() {
  try {
    console.log('🔄 REASIGNANDO PEDIDO AL REPARTIDOR DE PRUEBA');
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

    // Buscar un pedido DESPACHADO para reasignar
    const pedidoDespachado = await prisma.orders.findFirst({
      where: {
        status: 'DESPACHADO'
      },
      select: {
        id: true,
        status: true,
        id_delivery: true,
        id_client: true,
        created_at: true
      }
    });

    if (!pedidoDespachado) {
      console.log('❌ No se encontró ningún pedido DESPACHADO');
      return;
    }

    console.log(`📦 Pedido encontrado: ID ${pedidoDespachado.id}, Estado: ${pedidoDespachado.status}, Repartidor actual: ${pedidoDespachado.id_delivery}`);

    // Reasignar el pedido al repartidor de prueba
    await prisma.orders.update({
      where: {
        id: pedidoDespachado.id
      },
      data: {
        id_delivery: repartidor.id,
        updated_at: new Date()
      }
    });

    console.log(`✅ Pedido ${pedidoDespachado.id} reasignado al repartidor de prueba`);

    // Verificar la reasignación
    const pedidoReasignado = await prisma.orders.findUnique({
      where: {
        id: pedidoDespachado.id
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
  reassignOrder();
}

module.exports = {
  reassignOrder
};

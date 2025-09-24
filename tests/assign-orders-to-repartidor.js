const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignOrdersToRepartidor() {
  try {
    console.log('🚚 ASIGNANDO PEDIDOS AL REPARTIDOR DE PRUEBA');
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

    // Buscar pedidos DESPACHADO sin repartidor asignado
    const pedidosDespachado = await prisma.orders.findMany({
      where: {
        status: 'DESPACHADO',
        id_delivery: null
      },
      select: {
        id: true,
        status: true,
        id_client: true,
        created_at: true
      }
    });

    console.log(`\n📦 Pedidos DESPACHADO sin repartidor: ${pedidosDespachado.length}`);

    if (pedidosDespachado.length === 0) {
      console.log('⚠️  No hay pedidos DESPACHADO sin repartidor asignado');
      
      // Mostrar todos los pedidos DESPACHADO
      const todosPedidosDespachado = await prisma.orders.findMany({
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

      console.log('\n📋 Todos los pedidos DESPACHADO:');
      todosPedidosDespachado.forEach(pedido => {
        console.log(`   ID: ${pedido.id}, Repartidor: ${pedido.id_delivery || 'SIN_ASIGNAR'}, Cliente: ${pedido.id_client}`);
      });

      return;
    }

    // Asignar los primeros 2 pedidos al repartidor
    const pedidosParaAsignar = pedidosDespachado.slice(0, 2);
    
    console.log(`\n🔄 Asignando ${pedidosParaAsignar.length} pedidos al repartidor...`);

    for (const pedido of pedidosParaAsignar) {
      await prisma.orders.update({
        where: {
          id: pedido.id
        },
        data: {
          id_delivery: repartidor.id,
          updated_at: new Date()
        }
      });

      console.log(`   ✅ Pedido ${pedido.id} asignado al repartidor`);
    }

    // Verificar la asignación
    const pedidosAsignados = await prisma.orders.findMany({
      where: {
        id_delivery: repartidor.id,
        status: 'DESPACHADO'
      },
      select: {
        id: true,
        status: true,
        id_client: true,
        created_at: true
      }
    });

    console.log(`\n✅ Total de pedidos DESPACHADO asignados al repartidor: ${pedidosAsignados.length}`);
    
    pedidosAsignados.forEach(pedido => {
      console.log(`   ID: ${pedido.id}, Estado: ${pedido.status}, Cliente: ${pedido.id_client}`);
    });

    console.log('\n🎉 Asignación completada exitosamente');

  } catch (error) {
    console.error('❌ Error al asignar pedidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la asignación
if (require.main === module) {
  assignOrdersToRepartidor();
}

module.exports = {
  assignOrdersToRepartidor
};

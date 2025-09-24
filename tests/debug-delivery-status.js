const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Configuración del servidor
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Función para hacer login y obtener token
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      return response.data.token;
    } else {
      throw new Error('Error en login: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para obtener pedidos asignados al repartidor
async function getAssignedOrders(token) {
  try {
    const response = await axios.get(`${API_URL}/delivery/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('Error al obtener pedidos: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error al obtener pedidos:', error.response?.data || error.message);
    throw error;
  }
}

// Función para actualizar el estado de un pedido
async function updateOrderStatus(token, orderId, status) {
  try {
    console.log(`\n🔄 Actualizando pedido ${orderId} a estado: ${status}`);
    
    const response = await axios.put(`${API_URL}/delivery/orders/${orderId}/status`, {
      status: status
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Estado actualizado exitosamente');
      return response.data;
    } else {
      throw new Error('Error al actualizar estado: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Error al actualizar estado:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// Función principal de debugging
async function debugDeliveryStatus() {
  try {
    console.log('🚀 INICIANDO DEBUGGING COMPLETO DEL SISTEMA DE DELIVERY');
    console.log('=' .repeat(80));

    // 1. Verificar estado de la base de datos
    console.log('\n1️⃣ VERIFICANDO ESTADO DE LA BASE DE DATOS...');
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        status: true,
        id_delivery: true,
        id_client: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`   Total de pedidos: ${orders.length}`);
    
    const statusCounts = {};
    orders.forEach(order => {
      const status = order.status || 'SIN_ESTADO';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('   Distribución por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count} pedidos`);
    });

    // 2. Verificar si hay pedidos DESPACHADO
    const despachadoOrders = orders.filter(order => order.status === 'DESPACHADO');
    console.log(`\n   Pedidos DESPACHADO disponibles: ${despachadoOrders.length}`);

    if (despachadoOrders.length === 0) {
      console.log('   ⚠️  No hay pedidos DESPACHADO para probar');
      console.log('   💡 Ejecuta: node create-test-order.js');
      return;
    }

    // 3. Login como repartidor
    console.log('\n2️⃣ INICIANDO SESIÓN COMO REPARTIDOR...');
    const deliveryToken = await loginUser('repartidor@test.com', 'password123');
    console.log('   ✅ Login exitoso como repartidor');

    // 4. Obtener pedidos asignados
    console.log('\n3️⃣ OBTENIENDO PEDIDOS ASIGNADOS...');
    const assignedOrders = await getAssignedOrders(deliveryToken);
    console.log(`   ✅ Se encontraron ${assignedOrders.length} pedidos asignados`);

    if (assignedOrders.length === 0) {
      console.log('   ⚠️  No hay pedidos asignados al repartidor');
      return;
    }

    // Mostrar información de los pedidos
    assignedOrders.forEach((order, index) => {
      console.log(`\n   📦 Pedido ${index + 1}:`);
      console.log(`      ID: ${order.id}`);
      console.log(`      Estado: ${order.status}`);
      console.log(`      Cliente: ${order.client?.name} ${order.client?.lastname}`);
      console.log(`      Total: $${order.total}`);
    });

    // 5. Probar actualización de estado
    console.log('\n4️⃣ PROBANDO ACTUALIZACIÓN DE ESTADO...');
    
    // Buscar un pedido con estado 'DESPACHADO' para cambiar a 'EN CAMINO'
    const despachadoOrder = assignedOrders.find(order => order.status === 'DESPACHADO');
    
    if (despachadoOrder) {
      console.log(`\n   🎯 PROBANDO: DESPACHADO → EN CAMINO`);
      console.log(`      Pedido ID: ${despachadoOrder.id}`);
      console.log(`      Estado actual: ${despachadoOrder.status}`);
      console.log(`      Estado a enviar: 'EN CAMINO'`);
      
      try {
        await updateOrderStatus(deliveryToken, despachadoOrder.id, 'EN CAMINO');
        console.log('   ✅ TRANSICIÓN EXITOSA: DESPACHADO → EN CAMINO');
      } catch (error) {
        console.log('   ❌ TRANSICIÓN FALLÓ: DESPACHADO → EN CAMINO');
        console.log('      Este es el error que está viendo el frontend');
      }
    } else {
      console.log('   ⚠️  No se encontró ningún pedido con estado DESPACHADO');
    }

    // 6. Probar transición EN CAMINO → ENTREGADO
    const enCaminoOrder = assignedOrders.find(order => order.status === 'EN CAMINO');
    
    if (enCaminoOrder) {
      console.log(`\n   🎯 PROBANDO: EN CAMINO → ENTREGADO`);
      console.log(`      Pedido ID: ${enCaminoOrder.id}`);
      console.log(`      Estado actual: ${enCaminoOrder.status}`);
      console.log(`      Estado a enviar: 'ENTREGADO'`);
      
      try {
        await updateOrderStatus(deliveryToken, enCaminoOrder.id, 'ENTREGADO');
        console.log('   ✅ TRANSICIÓN EXITOSA: EN CAMINO → ENTREGADO');
      } catch (error) {
        console.log('   ❌ TRANSICIÓN FALLÓ: EN CAMINO → ENTREGADO');
      }
    } else {
      console.log('   ⚠️  No se encontró ningún pedido con estado EN CAMINO');
    }

    // 7. Probar estados inválidos
    console.log('\n5️⃣ PROBANDO ESTADOS INVÁLIDOS...');
    
    if (assignedOrders.length > 0) {
      const testOrder = assignedOrders[0];
      
      // Probar estado inválido
      try {
        await updateOrderStatus(deliveryToken, testOrder.id, 'ESTADO_INVALIDO');
        console.log('   ❌ ERROR: Se aceptó un estado inválido');
      } catch (error) {
        console.log('   ✅ Correctamente rechazó estado inválido');
      }

      // Probar transición inválida
      if (testOrder.status === 'EN CAMINO') {
        try {
          await updateOrderStatus(deliveryToken, testOrder.id, 'DESPACHADO');
          console.log('   ❌ ERROR: Se aceptó una transición inválida');
        } catch (error) {
          console.log('   ✅ Correctamente rechazó transición inválida');
        }
      }
    }

    console.log('\n🎉 DEBUGGING COMPLETADO');
    console.log('=' .repeat(80));
    console.log('💡 Revisa los logs del servidor para ver el debugging detallado');
    console.log('💡 Si hay errores, revisa la consola del servidor para ver los logs de debugging');

  } catch (error) {
    console.error('❌ Error en el debugging:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el debugging
if (require.main === module) {
  debugDeliveryStatus();
}

module.exports = {
  debugDeliveryStatus
};

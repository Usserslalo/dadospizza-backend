const axios = require('axios');

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

// Función que simula exactamente lo que hace el frontend
async function markOrderAsInTransit(token, orderId) {
  try {
    console.log(`\n🚚 Simulando "Recoger Pedido" del frontend...`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Estado a enviar: 'EN CAMINO'`);
    
    // Esta es la llamada exacta que hace el frontend
    const response = await axios.put(`${API_URL}/delivery/orders/${orderId}/status`, {
      status: 'EN CAMINO'  // Exactamente como lo envía el frontend
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Estado actualizado exitosamente desde el frontend');
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      throw new Error('Error al actualizar estado: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Error al actualizar estado desde el frontend:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);
    throw error;
  }
}

// Función principal que simula el flujo del frontend
async function simulateFrontendFlow() {
  try {
    console.log('🚀 SIMULANDO FLUJO COMPLETO DEL FRONTEND');
    console.log('=' .repeat(60));

    // 1. Login como repartidor
    console.log('\n1️⃣ Iniciando sesión como repartidor...');
    const deliveryToken = await loginUser('repartidor@test.com', 'password123');
    console.log('✅ Login exitoso como repartidor');

    // 2. Obtener pedidos asignados
    console.log('\n2️⃣ Obteniendo pedidos asignados...');
    const assignedOrders = await getAssignedOrders(deliveryToken);
    console.log(`✅ Se encontraron ${assignedOrders.length} pedidos asignados`);
    
    if (assignedOrders.length === 0) {
      console.log('⚠️  No hay pedidos asignados para probar');
      return;
    }

    // Mostrar información de los pedidos
    assignedOrders.forEach((order, index) => {
      console.log(`\n📦 Pedido ${index + 1}:`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Estado actual: ${order.status}`);
      console.log(`   Cliente: ${order.client?.name} ${order.client?.lastname}`);
      console.log(`   Total: $${order.total}`);
    });

    // 3. Simular el flujo del frontend
    console.log('\n3️⃣ Simulando flujo del frontend...');
    
    // Buscar un pedido con estado 'DESPACHADO' para simular "Recoger Pedido"
    const despachadoOrder = assignedOrders.find(order => order.status === 'DESPACHADO');
    
    if (despachadoOrder) {
      console.log(`\n🎯 SIMULANDO: Usuario presiona "Recoger Pedido"`);
      console.log(`   Pedido ID: ${despachadoOrder.id}`);
      console.log(`   Estado actual: ${despachadoOrder.status}`);
      console.log(`   Estado a enviar: 'EN CAMINO'`);
      
      try {
        await markOrderAsInTransit(deliveryToken, despachadoOrder.id);
        console.log('✅ SIMULACIÓN EXITOSA: El frontend pudo actualizar el estado');
      } catch (error) {
        console.log('❌ SIMULACIÓN FALLÓ: El frontend no pudo actualizar el estado');
        console.log('   Este es el error que está viendo el usuario en Flutter');
      }
    } else {
      console.log('⚠️  No se encontró ningún pedido con estado DESPACHADO para simular');
      
      // Si no hay pedidos DESPACHADO, mostrar los que hay
      if (assignedOrders.length > 0) {
        console.log('\n📋 Estados de pedidos disponibles:');
        assignedOrders.forEach(order => {
          console.log(`   Pedido ${order.id}: ${order.status}`);
        });
      }
    }

    console.log('\n🎉 SIMULACIÓN COMPLETADA');
    console.log('=' .repeat(60));
    console.log('💡 Revisa los logs del servidor para ver el debugging detallado');

  } catch (error) {
    console.error('❌ Error en la simulación:', error.message);
  }
}

// Ejecutar la simulación
if (require.main === module) {
  simulateFrontendFlow();
}

module.exports = {
  simulateFrontendFlow,
  markOrderAsInTransit
};

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
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      throw new Error('Error al actualizar estado: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de prueba
async function testDeliveryStatusUpdate() {
  try {
    console.log('🚀 INICIANDO PRUEBA DE ACTUALIZACIÓN DE ESTADO DE PEDIDOS');
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

    // 3. Probar actualización de estado
    console.log('\n3️⃣ Probando actualización de estado...');
    
    // Buscar un pedido con estado 'DESPACHADO' para cambiar a 'EN CAMINO'
    const despachadoOrder = assignedOrders.find(order => order.status === 'DESPACHADO');
    
    if (despachadoOrder) {
      console.log(`\n🔄 Probando transición DESPACHADO → EN CAMINO`);
      console.log(`Pedido ID: ${despachadoOrder.id}`);
      
      try {
        await updateOrderStatus(deliveryToken, despachadoOrder.id, 'EN CAMINO');
        console.log('✅ Transición DESPACHADO → EN CAMINO exitosa');
      } catch (error) {
        console.log('❌ Error en transición DESPACHADO → EN CAMINO:', error.message);
      }
    } else {
      console.log('⚠️  No se encontró ningún pedido con estado DESPACHADO');
    }

    // Buscar un pedido con estado 'EN CAMINO' para cambiar a 'ENTREGADO'
    const enCaminoOrder = assignedOrders.find(order => order.status === 'EN CAMINO');
    
    if (enCaminoOrder) {
      console.log(`\n🔄 Probando transición EN CAMINO → ENTREGADO`);
      console.log(`Pedido ID: ${enCaminoOrder.id}`);
      
      try {
        await updateOrderStatus(deliveryToken, enCaminoOrder.id, 'ENTREGADO');
        console.log('✅ Transición EN CAMINO → ENTREGADO exitosa');
      } catch (error) {
        console.log('❌ Error en transición EN CAMINO → ENTREGADO:', error.message);
      }
    } else {
      console.log('⚠️  No se encontró ningún pedido con estado EN CAMINO');
    }

    // 4. Probar estados inválidos
    console.log('\n4️⃣ Probando estados inválidos...');
    
    if (assignedOrders.length > 0) {
      const testOrder = assignedOrders[0];
      
      // Probar estado inválido
      try {
        await updateOrderStatus(deliveryToken, testOrder.id, 'ESTADO_INVALIDO');
        console.log('❌ ERROR: Se aceptó un estado inválido');
      } catch (error) {
        console.log('✅ Correctamente rechazó estado inválido:', error.message);
      }

      // Probar transición inválida (si el pedido está en EN CAMINO, intentar cambiar a DESPACHADO)
      if (testOrder.status === 'EN CAMINO') {
        try {
          await updateOrderStatus(deliveryToken, testOrder.id, 'DESPACHADO');
          console.log('❌ ERROR: Se aceptó una transición inválida');
        } catch (error) {
          console.log('✅ Correctamente rechazó transición inválida:', error.message);
        }
      }
    }

    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testDeliveryStatusUpdate();
}

module.exports = {
  testDeliveryStatusUpdate,
  loginUser,
  getAssignedOrders,
  updateOrderStatus
};

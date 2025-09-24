const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Función para hacer login
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

// Función para actualizar estado
async function updateOrderStatus(token, orderId, status) {
  try {
    console.log(`\n🔄 Probando estado: "${status}"`);
    
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
      return true;
    } else {
      throw new Error('Error al actualizar estado: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Error al actualizar estado:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

// Función principal de prueba
async function testStatusFormat() {
  try {
    console.log('🧪 PROBANDO FORMATOS DE ESTADO');
    console.log('=' .repeat(60));

    // 1. Login como repartidor
    console.log('\n1️⃣ Iniciando sesión como repartidor...');
    const token = await loginUser('repartidor@test.com', 'password123');
    console.log('✅ Login exitoso');

    // 2. Buscar un pedido DESPACHADO
    console.log('\n2️⃣ Buscando pedido DESPACHADO...');
    const ordersResponse = await axios.get(`${API_URL}/delivery/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const orders = ordersResponse.data.data;
    const despachadoOrder = orders.find(order => order.status === 'DESPACHADO');
    
    if (!despachadoOrder) {
      console.log('❌ No se encontró ningún pedido DESPACHADO');
      return;
    }

    console.log(`✅ Pedido encontrado: ID ${despachadoOrder.id}, Estado: ${despachadoOrder.status}`);

    // 3. Probar diferentes formatos de estado
    console.log('\n3️⃣ Probando diferentes formatos de estado...');
    
    const statusFormats = [
      'EN_CAMINO',      // ❌ Formato incorrecto (guión bajo)
      'EN CAMINO',      // ✅ Formato correcto (espacio)
      'EN-CAMINO',      // ❌ Formato incorrecto (guión)
      'en camino',      // ❌ Formato incorrecto (minúsculas)
      'EN CAMINO ',     // ❌ Formato incorrecto (espacio extra)
      ' EN CAMINO',     // ❌ Formato incorrecto (espacio al inicio)
    ];

    for (const status of statusFormats) {
      const success = await updateOrderStatus(token, despachadoOrder.id, status);
      
      if (success) {
        console.log(`   ✅ "${status}" - FUNCIONA`);
        break; // Si funciona, no probar más
      } else {
        console.log(`   ❌ "${status}" - FALLA`);
      }
    }

    // 4. Mostrar el formato correcto
    console.log('\n4️⃣ FORMATO CORRECTO PARA FLUTTER:');
    console.log('   const String EN_CAMINO = "EN CAMINO";  // ← Con ESPACIO');
    console.log('   const String ENTREGADO = "ENTREGADO";  // ← Sin espacio');
    
    console.log('\n5️⃣ EJEMPLO DE USO EN FLUTTER:');
    console.log('   await updateOrderStatus(token, orderId, "EN CAMINO");');
    console.log('   // NO usar: "EN_CAMINO" o "EN-CAMINO"');

    console.log('\n🎉 Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testStatusFormat();
}

module.exports = {
  testStatusFormat
};

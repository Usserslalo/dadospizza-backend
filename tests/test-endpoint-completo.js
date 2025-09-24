// test-endpoint-completo.js
// Script completo para probar el endpoint de historial de pedidos

const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api';

// Función para hacer login y obtener token
async function login() {
  try {
    console.log('🔐 Intentando hacer login...\n');
    
    const response = await axios.post(`${BASE_URL}/users/login`, {
      email: 'test@example.com', // Cambiar por un email válido
      password: 'password123'     // Cambiar por una contraseña válida
    });

    if (response.data.success && response.data.token) {
      console.log('✅ Login exitoso!');
      return response.data.token;
    } else {
      throw new Error('No se pudo obtener el token');
    }
  } catch (error) {
    console.error('❌ Error en login:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data.error || error.response.data.message}`);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Función para probar el endpoint de historial
async function testHistorialPedidos(token) {
  try {
    console.log('\n🧪 Probando endpoint GET /api/orders/my-history...\n');

    const response = await axios.get(`${BASE_URL}/orders/my-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta exitosa:');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${response.data.success}`);
    console.log(`Message: ${response.data.message}`);
    console.log(`Count: ${response.data.count}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📋 Pedidos encontrados:');
      response.data.data.forEach((order, index) => {
        console.log(`\n--- Pedido ${index + 1} ---`);
        console.log(`ID: ${order.id}`);
        console.log(`Estado: ${order.status}`);
        console.log(`Total: $${order.total}`);
        console.log(`Fecha: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`Dirección: ${order.address.address}`);
        console.log(`Sucursal: ${order.branches.name}`);
        console.log(`Productos: ${order.order_has_products.length}`);
        
        order.order_has_products.forEach((item, itemIndex) => {
          console.log(`  ${itemIndex + 1}. ${item.products.name} (${item.sizes?.name || 'Sin tamaño'}) x${item.quantity} - $${item.price_per_unit}`);
          if (item.order_item_addons.length > 0) {
            console.log(`     Extras: ${item.order_item_addons.map(addon => addon.addons.name).join(', ')}`);
          }
        });
      });
    } else {
      console.log('\n📭 No se encontraron pedidos para este usuario');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data.error || error.response.data.message}`);
      
      if (error.response.status === 401) {
        console.error('💡 Solución: Verifica que el token sea válido y no haya expirado');
      } else if (error.response.status === 403) {
        console.error('💡 Solución: Verifica que el usuario tenga el rol de CLIENTE');
      }
    } else if (error.request) {
      console.error('Error de conexión: No se pudo conectar al servidor');
      console.error('💡 Solución: Verifica que el servidor esté ejecutándose en el puerto 3000');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función para probar sin token (debería fallar)
async function testSinToken() {
  try {
    console.log('\n🧪 Probando endpoint sin token (debería fallar)...\n');

    const response = await axios.get(`${BASE_URL}/orders/my-history`);
    console.log('❌ ERROR: El endpoint debería requerir autenticación');
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correcto: El endpoint requiere autenticación');
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }
}

// Función principal
async function ejecutarPruebas() {
  console.log('🚀 Iniciando pruebas del endpoint de historial de pedidos\n');
  console.log('=' .repeat(60));
  
  // Probar sin token
  await testSinToken();
  
  // Intentar hacer login
  const token = await login();
  
  if (token) {
    // Probar con token válido
    await testHistorialPedidos(token);
  } else {
    console.log('\n⚠️  No se pudo obtener token. Saltando prueba con autenticación.');
    console.log('💡 Sugerencia: Verifica las credenciales de login o crea un usuario de prueba');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = {
  login,
  testHistorialPedidos,
  testSinToken,
  ejecutarPruebas
};

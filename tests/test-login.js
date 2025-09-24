const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

async function testLogin() {
  try {
    console.log('🔐 PROBANDO LOGIN DEL REPARTIDOR');
    console.log('=' .repeat(60));

    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'repartidor@test.com',
      password: 'password123'
    });

    console.log('✅ Login exitoso');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error en login:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

testLogin();

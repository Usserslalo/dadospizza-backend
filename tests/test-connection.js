// test-connection.js
const { Client } = require('pg');

// ▼▼▼ PEGA TU EXTERNAL URL DE RENDER AQUÍ DENTRO DE LAS COMILLAS ▼▼▼
const connectionString = 'postgresql://dados_pizza_user:R98aTQDoeqE5OT5WosBxSWozJEKGkjWq@dpg-d35lj9ali9vc738gmqr0-a.oregon-postgres.render.com/dados_pizza';
// ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲

// if (connectionString === 'postgresql://dados_pizza_user:R98aTQDoeqE5OT5WosBxSWozJEKGkjWq@dpg-d35lj9ali9vc738gmqr0-a.oregon-postgres.render.com/dados_pizza') {
//   console.error('Error: Por favor, edita el archivo test-connection.js y pega tu External URL de Render.');
//   process.exit(1);
// }

console.log('Intentando conectar a la base de datos de Render...');

const client = new Client({
  connectionString: connectionString,
  // Render puede requerir SSL para conexiones externas
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ ¡CONEXIÓN EXITOSA! La base de datos y tus credenciales son correctas.');
    
    // Hacemos una consulta simple para estar 100% seguros
    const res = await client.query('SELECT NOW()');
    console.log('Respuesta del servidor:', res.rows[0]);

  } catch (err) {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error('--------------------');
    console.error('Este es el error específico que nos da el servidor:');
    console.error(err.message);
    console.error('--------------------');
    console.error('Esto confirma que el problema NO es DBeaver, sino un dato incorrecto o un bloqueo de red.');
  } finally {
    await client.end();
    console.log('Conexión cerrada.');
  }
}

testConnection();
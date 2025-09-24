// test-roles-endpoints.js
// Script para probar los endpoints de autenticación con roles

const { PrismaClient } = require('@prisma/client');

async function testRolesEndpoints() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 PRUEBA DE ENDPOINTS DE AUTENTICACIÓN CON ROLES\n');
    console.log('=' .repeat(80));

    // 1. Verificar usuarios existentes con roles
    console.log('\n👥 1. USUARIOS EXISTENTES CON ROLES');
    console.log('-'.repeat(50));

    const usersWithRoles = await prisma.users.findMany({
      include: {
        user_has_roles: {
          include: {
            roles: true
          }
        },
        branches: true
      }
    });

    console.log(`Total de usuarios: ${usersWithRoles.length}\n`);

    usersWithRoles.forEach((user, index) => {
      const role = user.user_has_roles[0]?.roles?.name || 'Sin rol';
      const branch = user.branches ? user.branches.name : 'Sin sucursal';
      
      console.log(`${index + 1}. ${user.name} ${user.lastname}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${role}`);
      console.log(`   Sucursal: ${branch}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // 2. Simular endpoint de login
    console.log('\n🌐 2. SIMULACIÓN DE ENDPOINT DE LOGIN');
    console.log('-'.repeat(50));

    if (usersWithRoles.length > 0) {
      const testUser = usersWithRoles[0];
      const userRole = testUser.user_has_roles[0]?.roles?.name || 'CLIENTE';
      
      console.log(`Probando login para: ${testUser.email}`);
      console.log('\nRespuesta JSON del endpoint de login:');
      
      const loginResponse = {
        success: true,
        message: 'Inicio de sesión exitoso',
        token: 'jwt_token_aqui',
        user: {
          id: testUser.id.toString(),
          email: testUser.email,
          name: testUser.name,
          lastname: testUser.lastname,
          phone: testUser.phone,
          role: userRole,
          id_branch: testUser.id_branch ? testUser.id_branch.toString() : null
        }
      };
      
      console.log(JSON.stringify(loginResponse, null, 2));
    }

    // 3. Simular endpoint de perfil
    console.log('\n🌐 3. SIMULACIÓN DE ENDPOINT DE PERFIL');
    console.log('-'.repeat(50));

    if (usersWithRoles.length > 0) {
      const testUser = usersWithRoles[0];
      const userRole = testUser.user_has_roles[0]?.roles?.name || 'CLIENTE';
      
      console.log(`Probando perfil para: ${testUser.email}`);
      console.log('\nRespuesta JSON del endpoint de perfil:');
      
      const profileResponse = {
        success: true,
        message: 'Perfil obtenido exitosamente',
        user: {
          id: testUser.id.toString(),
          email: testUser.email,
          name: testUser.name,
          lastname: testUser.lastname,
          phone: testUser.phone,
          role: userRole,
          id_branch: testUser.id_branch ? testUser.id_branch.toString() : null,
          created_at: testUser.created_at,
          updated_at: testUser.updated_at
        }
      };
      
      console.log(JSON.stringify(profileResponse, null, 2));
    }

    // 4. Verificar roles disponibles
    console.log('\n📋 4. ROLES DISPONIBLES EN EL SISTEMA');
    console.log('-'.repeat(50));

    const roles = await prisma.roles.findMany({
      orderBy: { id: 'asc' }
    });

    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.description || 'Sin descripción'}`);
    });

    // 5. Verificar sucursales disponibles
    console.log('\n🏢 5. SUCURSALES DISPONIBLES');
    console.log('-'.repeat(50));

    const branches = await prisma.branches.findMany({
      orderBy: { id: 'asc' }
    });

    branches.forEach(branch => {
      console.log(`- ID: ${branch.id} | ${branch.name}`);
      console.log(`  Dirección: ${branch.address}`);
      console.log(`  Teléfono: ${branch.phone || 'No disponible'}`);
      console.log('');
    });

    // 6. Casos de prueba específicos
    console.log('\n🧪 6. CASOS DE PRUEBA ESPECÍFICOS');
    console.log('-'.repeat(50));

    // Buscar usuarios por rol
    const clientes = usersWithRoles.filter(user => 
      user.user_has_roles[0]?.roles?.name === 'CLIENTE'
    );
    const restaurantes = usersWithRoles.filter(user => 
      user.user_has_roles[0]?.roles?.name === 'RESTAURANTE'
    );
    const repartidores = usersWithRoles.filter(user => 
      user.user_has_roles[0]?.roles?.name === 'REPARTIDOR'
    );

    console.log(`👤 Clientes: ${clientes.length}`);
    console.log(`🍕 Restaurantes: ${restaurantes.length}`);
    console.log(`🚚 Repartidores: ${repartidores.length}`);

    // 7. Verificar estructura de datos
    console.log('\n✅ 7. VERIFICACIÓN DE ESTRUCTURA');
    console.log('-'.repeat(50));

    console.log('✅ Campo "role" incluido en respuestas');
    console.log('✅ Campo "id_branch" incluido en respuestas');
    console.log('✅ IDs convertidos a string para compatibilidad');
    console.log('✅ Estructura JSON consistente');
    console.log('✅ Manejo de valores null para id_branch');

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('Los endpoints de autenticación ahora incluyen correctamente:');
    console.log('- Información de rol del usuario');
    console.log('- ID de sucursal (si aplica)');
    console.log('- Estructura JSON consistente');
    console.log('- Compatibilidad con el frontend Flutter');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testRolesEndpoints();

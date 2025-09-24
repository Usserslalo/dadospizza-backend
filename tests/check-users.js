const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 VERIFICANDO USUARIOS EN LA BASE DE DATOS');
    console.log('=' .repeat(60));

    // Obtener todos los usuarios con sus roles
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        phone: true,
        created_at: true,
        user_has_roles: {
          include: {
            roles: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`\n📊 Total de usuarios en la base de datos: ${users.length}`);

    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
      return;
    }

    // Agrupar por rol
    const roleCounts = {};
    users.forEach(user => {
      const roles = user.user_has_roles.map(ur => ur.roles.name);
      if (roles.length === 0) {
        roleCounts['SIN_ROL'] = (roleCounts['SIN_ROL'] || 0) + 1;
      } else {
        roles.forEach(role => {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
      }
    });

    console.log('\n📈 Distribución por rol:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} usuarios`);
    });

    // Mostrar usuarios con rol REPARTIDOR
    const repartidores = users.filter(user => 
      user.user_has_roles.some(ur => ur.roles.name === 'REPARTIDOR')
    );
    console.log(`\n🚚 Usuarios con rol REPARTIDOR (${repartidores.length}):`);
    repartidores.forEach(user => {
      console.log(`   ID: ${user.id}, Email: ${user.email}, Nombre: ${user.name} ${user.lastname}`);
    });

    // Mostrar usuarios con rol CLIENTE
    const clientes = users.filter(user => 
      user.user_has_roles.some(ur => ur.roles.name === 'CLIENTE')
    );
    console.log(`\n👤 Usuarios con rol CLIENTE (${clientes.length}):`);
    clientes.forEach(user => {
      console.log(`   ID: ${user.id}, Email: ${user.email}, Nombre: ${user.name} ${user.lastname}`);
    });

    // Mostrar usuarios con rol ADMIN
    const admins = users.filter(user => 
      user.user_has_roles.some(ur => ur.roles.name === 'ADMIN')
    );
    console.log(`\n👨‍💼 Usuarios con rol ADMIN (${admins.length}):`);
    admins.forEach(user => {
      console.log(`   ID: ${user.id}, Email: ${user.email}, Nombre: ${user.name} ${user.lastname}`);
    });

    // Mostrar todos los usuarios
    console.log('\n📋 Todos los usuarios:');
    users.forEach((user, index) => {
      const roles = user.user_has_roles.map(ur => ur.roles.name).join(', ') || 'SIN_ROL';
      console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Roles: ${roles}, Nombre: ${user.name} ${user.lastname}`);
    });

    console.log('\n🎉 Verificación de usuarios completada');

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
if (require.main === module) {
  checkUsers();
}

module.exports = {
  checkUsers
};

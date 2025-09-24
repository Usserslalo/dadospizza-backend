const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestRepartidor() {
  try {
    console.log('🔧 CREANDO USUARIO REPARTIDOR DE PRUEBA');
    console.log('=' .repeat(60));

    // Verificar si ya existe un repartidor
    const existingRepartidor = await prisma.users.findFirst({
      where: {
        email: 'repartidor@test.com'
      }
    });

    if (existingRepartidor) {
      console.log('✅ Ya existe un repartidor de prueba');
      console.log(`   Email: ${existingRepartidor.email}`);
      console.log(`   Nombre: ${existingRepartidor.name} ${existingRepartidor.lastname}`);
      return existingRepartidor;
    }

    // Buscar el rol REPARTIDOR
    const repartidorRole = await prisma.roles.findFirst({
      where: {
        name: 'REPARTIDOR'
      }
    });

    if (!repartidorRole) {
      console.log('❌ No se encontró el rol REPARTIDOR');
      return;
    }

    // Buscar una sucursal para asignar al repartidor
    const branch = await prisma.branches.findFirst();

    if (!branch) {
      console.log('❌ No se encontró ninguna sucursal');
      return;
    }

    // Hash de la contraseña usando bcryptjs (igual que el sistema)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // Crear el usuario repartidor
    const repartidor = await prisma.users.create({
      data: {
        email: 'repartidor@test.com',
        name: 'Repartidor',
        lastname: 'Test',
        phone: '9876543210',
        password: hashedPassword,
        id_branch: branch.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log('✅ Usuario repartidor creado exitosamente');
    console.log(`   ID: ${repartidor.id}`);
    console.log(`   Email: ${repartidor.email}`);
    console.log(`   Nombre: ${repartidor.name} ${repartidor.lastname}`);
    console.log(`   Contraseña: password123`);

    // Asignar el rol REPARTIDOR
    await prisma.user_has_roles.create({
      data: {
        id_user: repartidor.id,
        id_rol: repartidorRole.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log('✅ Rol REPARTIDOR asignado exitosamente');

    console.log('\n🎉 Repartidor de prueba creado exitosamente');
    console.log('   Ahora puedes usar: repartidor@test.com / password123');

    return repartidor;

  } catch (error) {
    console.error('❌ Error al crear repartidor de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la creación
if (require.main === module) {
  createTestRepartidor();
}

module.exports = {
  createTestRepartidor
};

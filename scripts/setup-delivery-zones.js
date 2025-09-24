// scripts/setup-delivery-zones.js
// Script para configurar zonas de cobertura y asignar repartidores

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDeliveryZones() {
  try {
    console.log('🏪 Configurando zonas de cobertura para Dados Pizza...');
    console.log('=' .repeat(70));

    // 1. Verificar sucursales existentes
    console.log('\n📋 1. VERIFICANDO SUCURSALES:');
    const branches = await prisma.branches.findMany();
    console.log(`Sucursales encontradas: ${branches.length}`);
    
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.name}`);
      console.log(`   ID: ${branch.id}`);
      console.log(`   Dirección: ${branch.address}`);
      console.log(`   Coordenadas: ${branch.lat}, ${branch.lng}`);
      console.log('');
    });

    if (branches.length === 0) {
      console.log('❌ No se encontraron sucursales. Creando sucursales de ejemplo...');
      
      // Crear sucursales de ejemplo
      const exampleBranches = [
        {
          name: 'Dados Pizza - Ixmiquilpan Centro',
          address: 'Centro de Ixmiquilpan, Hidalgo',
          lat: 20.4833,
          lng: -99.2167,
          phone: '771-123-4567'
        },
        {
          name: 'Dados Pizza - Ixmiquilpan Norte',
          address: 'Zona Norte de Ixmiquilpan, Hidalgo',
          lat: 20.5000,
          lng: -99.2000,
          phone: '771-123-4568'
        },
        {
          name: 'Dados Pizza - Progreso de Obregón',
          address: 'Progreso de Obregón, Hidalgo',
          lat: 20.2500,
          lng: -99.1833,
          phone: '771-123-4569'
        }
      ];

      for (const branchData of exampleBranches) {
        const branch = await prisma.branches.create({
          data: {
            ...branchData,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        console.log(`✅ Sucursal creada: ${branch.name} (ID: ${branch.id})`);
      }
    }

    // 2. Verificar zonas de cobertura
    console.log('\n🗺️ 2. VERIFICANDO ZONAS DE COBERTURA:');
    const zones = await prisma.delivery_zones.findMany({
      include: { branches: true }
    });
    
    console.log(`Zonas encontradas: ${zones.length}`);
    zones.forEach((zone, index) => {
      console.log(`${index + 1}. ${zone.name}`);
      console.log(`   Sucursal: ${zone.branches.name}`);
      console.log(`   Distancia máxima: ${zone.max_delivery_distance} km`);
      console.log(`   Activa: ${zone.is_active ? 'Sí' : 'No'}`);
      console.log('');
    });

    if (zones.length === 0) {
      console.log('❌ No se encontraron zonas. Creando zonas de ejemplo...');
      
      // Crear zonas para cada sucursal
      for (const branch of branches) {
        const zone = await prisma.delivery_zones.create({
          data: {
            name: `${branch.name} - Zona Principal`,
            id_branch: branch.id,
            max_delivery_distance: 5.0,
            polygon_coordinates: {
              center: { lat: branch.lat, lng: branch.lng },
              radius: 5.0,
              polygon: [
                { lat: branch.lat + 0.05, lng: branch.lng - 0.05 },
                { lat: branch.lat + 0.05, lng: branch.lng + 0.05 },
                { lat: branch.lat - 0.05, lng: branch.lng + 0.05 },
                { lat: branch.lat - 0.05, lng: branch.lng - 0.05 }
              ]
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        console.log(`✅ Zona creada: ${zone.name}`);
      }
    }

    // 3. Verificar repartidores existentes
    console.log('\n👥 3. VERIFICANDO REPARTIDORES:');
    const deliveries = await prisma.users.findMany({
      where: {
        user_has_roles: {
          some: {
            roles: { name: 'REPARTIDOR' }
          }
        }
      },
      include: {
        branches: true,
        delivery_zone_assignments: {
          include: { delivery_zones: true }
        }
      }
    });

    console.log(`Repartidores encontrados: ${deliveries.length}`);
    deliveries.forEach((delivery, index) => {
      console.log(`${index + 1}. ${delivery.name} ${delivery.lastname}`);
      console.log(`   Email: ${delivery.email}`);
      console.log(`   Sucursal: ${delivery.branches?.name || 'Sin asignar'}`);
      console.log(`   Zonas asignadas: ${delivery.delivery_zone_assignments.length}`);
      delivery.delivery_zone_assignments.forEach(assignment => {
        console.log(`     - ${assignment.delivery_zones.name}`);
      });
      console.log('');
    });

    // 4. Asignar repartidores a zonas de su sucursal
    console.log('\n🔗 4. ASIGNANDO REPARTIDORES A ZONAS:');
    
    for (const delivery of deliveries) {
      if (!delivery.id_branch) {
        console.log(`⚠️ Repartidor ${delivery.name} no tiene sucursal asignada`);
        continue;
      }

      // Buscar zonas de la sucursal del repartidor
      const branchZones = await prisma.delivery_zones.findMany({
        where: { 
          id_branch: delivery.id_branch,
          is_active: true
        }
      });

      if (branchZones.length === 0) {
        console.log(`⚠️ No hay zonas para la sucursal del repartidor ${delivery.name}`);
        continue;
      }

      // Asignar a todas las zonas de la sucursal
      for (const zone of branchZones) {
        const existingAssignment = await prisma.delivery_zone_assignments.findFirst({
          where: {
            id_user: delivery.id,
            id_zone: zone.id
          }
        });

        if (!existingAssignment) {
          await prisma.delivery_zone_assignments.create({
            data: {
              id_user: delivery.id,
              id_zone: zone.id,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log(`✅ ${delivery.name} asignado a zona ${zone.name}`);
        } else {
          console.log(`ℹ️ ${delivery.name} ya está asignado a zona ${zone.name}`);
        }
      }
    }

    // 5. Crear repartidores de ejemplo si no existen
    if (deliveries.length === 0) {
      console.log('\n👤 5. CREANDO REPARTIDORES DE EJEMPLO:');
      
      const repartidorRole = await prisma.roles.findFirst({
        where: { name: 'REPARTIDOR' }
      });

      if (!repartidorRole) {
        console.log('❌ No se encontró el rol REPARTIDOR');
        return;
      }

      const exampleDeliveries = [
        {
          name: 'Carlos',
          lastname: 'Rodríguez',
          email: 'carlos.repartidor@dadospizza.com',
          phone: '771-100-0001',
          id_branch: branches[0]?.id
        },
        {
          name: 'María',
          lastname: 'González',
          email: 'maria.repartidor@dadospizza.com',
          phone: '771-100-0002',
          id_branch: branches[0]?.id
        },
        {
          name: 'José',
          lastname: 'López',
          email: 'jose.repartidor@dadospizza.com',
          phone: '771-100-0003',
          id_branch: branches[1]?.id
        },
        {
          name: 'Ana',
          lastname: 'Martínez',
          email: 'ana.repartidor@dadospizza.com',
          phone: '771-100-0004',
          id_branch: branches[2]?.id
        }
      ];

      for (const deliveryData of exampleDeliveries) {
        if (!deliveryData.id_branch) continue;

        const delivery = await prisma.users.create({
          data: {
            ...deliveryData,
            password: 'password123', // Contraseña temporal
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // Asignar rol de repartidor
        await prisma.user_has_roles.create({
          data: {
            id_user: delivery.id,
            id_rol: repartidorRole.id,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // Asignar a zona de su sucursal
        const branchZones = await prisma.delivery_zones.findMany({
          where: { 
            id_branch: delivery.id_branch,
            is_active: true
          }
        });

        for (const zone of branchZones) {
          await prisma.delivery_zone_assignments.create({
            data: {
              id_user: delivery.id,
              id_zone: zone.id,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }

        console.log(`✅ Repartidor creado: ${delivery.name} ${delivery.lastname} (Sucursal: ${branches.find(b => b.id === delivery.id_branch)?.name})`);
      }
    }

    // 6. Resumen final
    console.log('\n📊 6. RESUMEN DE CONFIGURACIÓN:');
    
    const finalBranches = await prisma.branches.findMany();
    const finalZones = await prisma.delivery_zones.findMany();
    const finalDeliveries = await prisma.users.findMany({
      where: {
        user_has_roles: {
          some: { roles: { name: 'REPARTIDOR' } }
        }
      }
    });
    const finalAssignments = await prisma.delivery_zone_assignments.findMany({
      where: { is_active: true }
    });

    console.log(`✅ Sucursales configuradas: ${finalBranches.length}`);
    console.log(`✅ Zonas de cobertura: ${finalZones.length}`);
    console.log(`✅ Repartidores activos: ${finalDeliveries.length}`);
    console.log(`✅ Asignaciones zona-repartidor: ${finalAssignments.length}`);

    console.log('\n🎯 CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('El sistema está listo para asignar repartidores por sucursal y zona de cobertura.');

  } catch (error) {
    console.error('❌ Error en la configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDeliveryZones();
}

module.exports = setupDeliveryZones;

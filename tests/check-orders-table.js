// check-orders-table.js
// Script para verificar la estructura de la tabla orders

const { PrismaClient } = require('@prisma/client');

async function checkOrdersTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO ESTRUCTURA DE LA TABLA ORDERS\n');
    console.log('=' .repeat(60));

    // Verificar la estructura de la tabla
    console.log('\n📊 ESTRUCTURA DE LA TABLA ORDERS:');
    const tableInfo = await prisma.$queryRaw`DESCRIBE orders`;
    console.log(tableInfo);

    // Verificar datos existentes
    console.log('\n📋 DATOS EXISTENTES EN LA TABLA ORDERS:');
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        status: true,
        created_at: true
      },
      take: 5
    });

    orders.forEach(order => {
      console.log(`ID: ${order.id} | Status: "${order.status}" | Fecha: ${order.created_at}`);
    });

    // Probar insertar un estado problemático
    console.log('\n🧪 PROBANDO INSERCIÓN DE ESTADO PROBLEMÁTICO:');
    try {
      const testOrder = await prisma.orders.create({
        data: {
          id_client: BigInt(1),
          id_address: BigInt(1),
          id_branch: BigInt(1),
          status: 'EN PREPARACION',
          payment_method: 'Efectivo',
          subtotal: 100.00,
          delivery_fee: 0.00,
          total: 100.00,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Estado "EN PREPARACION" se insertó correctamente');
      
      // Eliminar el registro de prueba
      await prisma.orders.delete({
        where: { id: testOrder.id }
      });
      console.log('✅ Registro de prueba eliminado');
      
    } catch (error) {
      console.log('❌ Error al insertar estado "EN PREPARACION":');
      console.log(error.message);
    }

    // Probar con guión bajo
    console.log('\n🧪 PROBANDO CON GUION BAJO:');
    try {
      const testOrder2 = await prisma.orders.create({
        data: {
          id_client: BigInt(1),
          id_address: BigInt(1),
          id_branch: BigInt(1),
          status: 'EN_PREPARACION',
          payment_method: 'Efectivo',
          subtotal: 100.00,
          delivery_fee: 0.00,
          total: 100.00,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Estado "EN_PREPARACION" se insertó correctamente');
      
      // Eliminar el registro de prueba
      await prisma.orders.delete({
        where: { id: testOrder2.id }
      });
      console.log('✅ Registro de prueba eliminado');
      
    } catch (error) {
      console.log('❌ Error al insertar estado "EN_PREPARACION":');
      console.log(error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrdersTable();

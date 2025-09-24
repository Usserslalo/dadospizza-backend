// src/services/branch-delivery-assignment.service.js
// Servicio para asignación de repartidores por sucursal y zona de cobertura

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BranchDeliveryAssignmentService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  /**
   * Asigna repartidor considerando sucursal y zona de cobertura
   * @param {BigInt} orderId - ID del pedido
   * @param {BigInt} branchId - ID de la sucursal
   * @param {Object} orderAddress - Dirección del pedido
   * @returns {Object} Resultado de la asignación
   */
  async assignDeliveryByBranch(orderId, branchId, orderAddress) {
    try {
      console.log(`🏪 Buscando repartidor para sucursal ${branchId}, pedido ${orderId}`);
      
      // 1. Verificar que el pedido pertenece a la sucursal correcta
      const order = await prisma.orders.findUnique({
        where: { id: BigInt(orderId) },
        include: { 
          branches: true,
          address: true
        }
      });

      if (!order) {
        throw new Error(`Pedido ${orderId} no encontrado`);
      }

      if (order.id_branch !== BigInt(branchId)) {
        throw new Error(`Pedido ${orderId} no pertenece a la sucursal ${branchId}`);
      }

      // 2. Determinar zona de cobertura del pedido
      const deliveryZone = await this.findDeliveryZone(branchId, orderAddress);
      
      if (!deliveryZone) {
        console.log(`⚠️ No se encontró zona de cobertura para la dirección del pedido ${orderId}`);
        return { 
          success: false, 
          message: 'Dirección fuera de zona de cobertura',
          code: 'OUT_OF_COVERAGE'
        };
      }

      // 3. Buscar repartidores de la zona específica
      const availableDeliveries = await this.getDeliveriesByZone(deliveryZone.id);
      
      if (availableDeliveries.length === 0) {
        console.log(`⚠️ No hay repartidores disponibles en la zona ${deliveryZone.name}`);
        return { 
          success: false, 
          message: 'No hay repartidores disponibles en esta zona',
          code: 'NO_DELIVERIES_AVAILABLE'
        };
      }

      // 4. Seleccionar mejor repartidor de la zona
      const selectedDelivery = this.selectBestDelivery(availableDeliveries);
      
      if (!selectedDelivery) {
        console.log(`⚠️ No se pudo seleccionar un repartidor para la zona ${deliveryZone.name}`);
        return { 
          success: false, 
          message: 'No se pudo seleccionar un repartidor',
          code: 'SELECTION_FAILED'
        };
      }

      // 5. Asignar el pedido
      await this.assignOrder(orderId, selectedDelivery.id);
      
      console.log(`✅ Pedido ${orderId} asignado a ${selectedDelivery.name} (Zona: ${deliveryZone.name})`);
      
      return { 
        success: true, 
        delivery: selectedDelivery, 
        zone: deliveryZone,
        message: `Pedido asignado a ${selectedDelivery.name} en zona ${deliveryZone.name}`
      };

    } catch (error) {
      console.error('❌ Error assigning delivery by branch:', error);
      return {
        success: false,
        message: error.message,
        code: 'ASSIGNMENT_ERROR'
      };
    }
  }

  /**
   * Encuentra la zona de cobertura para una dirección
   * @param {BigInt} branchId - ID de la sucursal
   * @param {Object} orderAddress - Dirección del pedido
   * @returns {Object|null} Zona de cobertura encontrada
   */
  async findDeliveryZone(branchId, orderAddress) {
    const cacheKey = `zones_${branchId}`;
    const cached = this.cache.get(cacheKey);
    
    let zones;
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      zones = cached.data;
    } else {
      zones = await prisma.delivery_zones.findMany({
        where: { 
          id_branch: BigInt(branchId),
          is_active: true
        },
        include: { 
          delivery_zone_assignments: {
            where: { is_active: true }
          }
        }
      });
      
      this.cache.set(cacheKey, {
        data: zones,
        timestamp: Date.now()
      });
    }

    // Por ahora, retornar la primera zona de la sucursal
    // TODO: Implementar lógica geográfica más sofisticada basada en coordenadas
    if (zones.length > 0) {
      return zones[0];
    }

    return null;
  }

  /**
   * Obtiene repartidores disponibles en una zona específica
   * @param {BigInt} zoneId - ID de la zona
   * @returns {Array} Lista de repartidores disponibles
   */
  async getDeliveriesByZone(zoneId) {
    try {
      const deliveries = await prisma.users.findMany({
        where: {
          delivery_zone_assignments: {
            some: {
              id_zone: BigInt(zoneId),
              is_active: true
            }
          },
          user_has_roles: {
            some: {
              roles: { name: 'REPARTIDOR' }
            }
          }
        },
        select: {
          id: true,
          name: true,
          lastname: true,
          phone: true,
          email: true,
          _count: {
            select: {
              orders_orders_id_deliveryTousers: {
                where: { 
                  status: { in: ['DESPACHADO', 'EN CAMINO'] }
                }
              }
            }
          }
        }
      });

      return deliveries;
    } catch (error) {
      console.error('Error getting deliveries by zone:', error);
      return [];
    }
  }

  /**
   * Selecciona el mejor repartidor basado en carga de trabajo
   * @param {Array} deliveries - Lista de repartidores disponibles
   * @returns {Object|null} Mejor repartidor seleccionado
   */
  selectBestDelivery(deliveries) {
    if (deliveries.length === 0) return null;
    
    // Seleccionar el que tenga menos pedidos asignados
    const selectedDelivery = deliveries.reduce((min, current) => 
      current._count.orders_orders_id_deliveryTousers < min._count.orders_orders_id_deliveryTousers ? current : min
    );

    return selectedDelivery;
  }

  /**
   * Asigna un pedido a un repartidor
   * @param {BigInt} orderId - ID del pedido
   * @param {BigInt} deliveryId - ID del repartidor
   */
  async assignOrder(orderId, deliveryId) {
    await prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: { 
        id_delivery: BigInt(deliveryId),
        updated_at: new Date()
      }
    });
  }

  /**
   * Obtiene estadísticas por sucursal
   * @param {BigInt} branchId - ID de la sucursal
   * @returns {Array} Estadísticas de pedidos por estado
   */
  async getBranchStats(branchId) {
    try {
      const stats = await prisma.orders.groupBy({
        by: ['status'],
        where: { id_branch: BigInt(branchId) },
        _count: { status: true }
      });

      return stats;
    } catch (error) {
      console.error('Error getting branch stats:', error);
      return [];
    }
  }

  /**
   * Obtiene repartidores por sucursal
   * @param {BigInt} branchId - ID de la sucursal
   * @returns {Array} Lista de repartidores de la sucursal
   */
  async getDeliveriesByBranch(branchId) {
    try {
      const deliveries = await prisma.users.findMany({
        where: {
          id_branch: BigInt(branchId),
          user_has_roles: {
            some: { roles: { name: 'REPARTIDOR' } }
          }
        },
        include: {
          delivery_zone_assignments: {
            include: { delivery_zones: true }
          },
          _count: {
            select: {
              orders_orders_id_deliveryTousers: {
                where: { status: { in: ['DESPACHADO', 'EN CAMINO'] } }
              }
            }
          }
        }
      });

      return deliveries;
    } catch (error) {
      console.error('Error getting deliveries by branch:', error);
      return [];
    }
  }

  /**
   * Asigna un repartidor a una zona
   * @param {BigInt} userId - ID del usuario
   * @param {BigInt} zoneId - ID de la zona
   * @returns {Object} Resultado de la asignación
   */
  async assignDeliveryToZone(userId, zoneId) {
    try {
      const assignment = await prisma.delivery_zone_assignments.upsert({
        where: {
          id_user_id_zone: {
            id_user: BigInt(userId),
            id_zone: BigInt(zoneId)
          }
        },
        update: { 
          is_active: true,
          updated_at: new Date()
        },
        create: {
          id_user: BigInt(userId),
          id_zone: BigInt(zoneId),
          is_active: true
        }
      });

      return { success: true, assignment };
    } catch (error) {
      console.error('Error assigning delivery to zone:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia la caché
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Caché de zonas limpiada');
  }
}

module.exports = new BranchDeliveryAssignmentService();

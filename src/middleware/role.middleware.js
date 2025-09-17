// src/middleware/role.middleware.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware de autorización por rol
 * Verifica si el usuario autenticado tiene el rol especificado
 * 
 * @param {string} requiredRole - El rol requerido (ej. 'RESTAURANTE', 'ADMIN', etc.)
 * @returns {Function} - Función middleware asíncrona
 */
const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado (debe venir del authMiddleware)
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        });
      }

      const userId = req.user.userId;

      // Buscar los roles del usuario en la base de datos
      const userRoles = await prisma.user_has_roles.findMany({
        where: {
          id_user: BigInt(userId)
        },
        include: {
          roles: true
        }
      });

      // Verificar si el usuario tiene el rol requerido
      const hasRequiredRole = userRoles.some(userRole => 
        userRole.roles.name === requiredRole
      );

      if (!hasRequiredRole) {
        return res.status(403).json({
          error: `Acceso denegado: no tienes los permisos necesarios para acceder a esta funcionalidad. Se requiere el rol: ${requiredRole}`
        });
      }

      // Si tiene el rol requerido, continuar al siguiente middleware
      next();

    } catch (error) {
      console.error('Error en middleware de autorización por rol:', error);
      
      return res.status(500).json({
        error: 'Error interno del servidor durante la verificación de permisos'
      });
    }
  };
};

module.exports = {
  checkRole
};

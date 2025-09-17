// src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación para validar tokens JWT
 * Extrae el token del header Authorization y valida su autenticidad
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extraer el token del header Authorization
    const authHeader = req.headers.authorization;
    
    // Verificar que se proporcione el header Authorization
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de autorización requerido. Incluya el header Authorization con formato Bearer <token>'
      });
    }

    // Verificar que el formato sea correcto (Bearer <token>)
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Formato de token inválido. Use el formato: Bearer <token>'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjuntar la información del usuario al objeto request
    req.user = {
      userId: decoded.userId
    };

    // Continuar al siguiente middleware o controlador
    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    // Manejar diferentes tipos de errores de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor, inicie sesión nuevamente'
      });
    }
    
    // Error genérico del servidor
    return res.status(500).json({
      error: 'Error interno del servidor durante la autenticación'
    });
  }
};

module.exports = authMiddleware;

// src/controllers/admin.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const sqlScript = require('../config/seed-script');

const seedDatabase = async (req, res) => {
  const { secret } = req.body;

  // Verificamos el secreto
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
  }

  try {
    // Prisma no soporta múltiples sentencias en una sola consulta por seguridad.
    // Dividimos el script en sentencias individuales.
    const statements = sqlScript.split(';').filter(s => s.trim() !== '');
    
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
    
    res.status(200).json({ message: 'Base de datos poblada exitosamente.' });
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    res.status(500).json({ error: 'Error interno del servidor al poblar la base de datos.' });
  }
};

module.exports = {
  seedDatabase,
};
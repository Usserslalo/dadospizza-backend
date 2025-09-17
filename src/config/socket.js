// src/config/socket.js

/**
 * Configuración de Socket.IO para notificaciones en tiempo real
 * Maneja conexiones, salas y eventos de notificación
 */

const configureSocket = (io) => {
  console.log('🔌 Socket.IO configurado correctamente');

  // Manejar nuevas conexiones
  io.on('connection', (socket) => {
    console.log(`👤 Cliente conectado: ${socket.id}`);

    // Evento para suscribirse a una sala específica
    socket.on('subscribe', (data) => {
      try {
        const { room } = data;
        
        if (!room) {
          socket.emit('error', { message: 'Room es requerido para suscribirse' });
          return;
        }

        // Unir el socket a la sala especificada
        socket.join(room);
        console.log(`📡 Socket ${socket.id} se unió a la sala: ${room}`);
        
        // Confirmar suscripción al cliente
        socket.emit('subscribed', { 
          room: room, 
          message: `Suscrito exitosamente a la sala ${room}` 
        });

      } catch (error) {
        console.error('Error al suscribirse a sala:', error);
        socket.emit('error', { message: 'Error al suscribirse a la sala' });
      }
    });

    // Evento para desuscribirse de una sala
    socket.on('unsubscribe', (data) => {
      try {
        const { room } = data;
        
        if (!room) {
          socket.emit('error', { message: 'Room es requerido para desuscribirse' });
          return;
        }

        // Salir de la sala especificada
        socket.leave(room);
        console.log(`📡 Socket ${socket.id} salió de la sala: ${room}`);
        
        // Confirmar desuscripción al cliente
        socket.emit('unsubscribed', { 
          room: room, 
          message: `Desuscrito exitosamente de la sala ${room}` 
        });

      } catch (error) {
        console.error('Error al desuscribirse de sala:', error);
        socket.emit('error', { message: 'Error al desuscribirse de la sala' });
      }
    });

    // Evento para obtener información de las salas del socket
    socket.on('get_rooms', () => {
      const rooms = Array.from(socket.rooms);
      socket.emit('rooms_info', { 
        socket_id: socket.id,
        rooms: rooms 
      });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`👋 Cliente desconectado: ${socket.id}, razón: ${reason}`);
    });

    // Manejar errores de conexión
    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  // Función para emitir notificaciones a salas específicas
  const emitToRoom = (room, event, data) => {
    try {
      io.to(room).emit(event, data);
      console.log(`📢 Evento '${event}' enviado a la sala '${room}'`);
    } catch (error) {
      console.error('Error al emitir evento a sala:', error);
    }
  };

  // Función para emitir notificaciones a múltiples salas
  const emitToRooms = (rooms, event, data) => {
    try {
      rooms.forEach(room => {
        io.to(room).emit(event, data);
        console.log(`📢 Evento '${event}' enviado a la sala '${room}'`);
      });
    } catch (error) {
      console.error('Error al emitir evento a múltiples salas:', error);
    }
  };

  // Función para obtener estadísticas de conexiones
  const getConnectionStats = () => {
    return {
      total_connections: io.engine.clientsCount,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    };
  };

  // Exportar funciones útiles para usar en controladores
  return {
    emitToRoom,
    emitToRooms,
    getConnectionStats
  };
};

module.exports = configureSocket;

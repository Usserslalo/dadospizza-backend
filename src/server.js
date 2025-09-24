// src/server.js

// 1. Importaciones
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const categoryRoutes = require('./routers/categories.routes'); // <-- Importamos nuestras nuevas rutas
const userRoutes = require('./routers/users.routes'); // <-- Importamos las rutas de usuarios
const addressRoutes = require('./routers/address.routes'); // <-- Importamos las rutas de direcciones
const productRoutes = require('./routers/products.routes'); // <-- Importamos las rutas de productos
const orderRoutes = require('./routers/orders.routes'); // <-- Importamos las rutas de pedidos
const restaurantRoutes = require('./routers/restaurant.routes'); // <-- Importamos las rutas del restaurante
const deliveryRoutes = require('./routers/delivery.routes'); // <-- Importamos las rutas del repartidor
const sizesRoutes = require('./routers/sizes.routes'); // <-- Importamos las rutas de tamaños
const configureSocket = require('./config/socket'); // <-- Importamos la configuración de Socket.IO

// Solución para el error de BigInt
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// 2. Inicializaciones
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Crear servidor HTTP y configurar Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, especificar dominios permitidos
    methods: ["GET", "POST"]
  }
});

// Configurar Socket.IO
const socketUtils = configureSocket(io);

// Hacer io disponible globalmente para los controladores
global.io = io;
global.socketUtils = socketUtils;

// 4. Middlewares
app.use(cors());
app.use(express.json());

// 5. Rutas
app.get('/', (req, res) => {
  res.send('¡API de Dados Pizza funcionando!');
});

// Le decimos a nuestra app que use las rutas de categorías
// Todo lo que empiece con '/api/categories' será manejado por 'categoryRoutes'
app.use('/api/categories', categoryRoutes);

// Le decimos a nuestra app que use las rutas de usuarios
// Todo lo que empiece con '/api/users' será manejado por 'userRoutes'
app.use('/api/users', userRoutes);

// Le decimos a nuestra app que use las rutas de direcciones
// Todo lo que empiece con '/api/addresses' será manejado por 'addressRoutes'
app.use('/api/addresses', addressRoutes);

// Le decimos a nuestra app que use las rutas de productos
// Todo lo que empiece con '/api/products' será manejado por 'productRoutes'
app.use('/api/products', productRoutes);

// Le decimos a nuestra app que use las rutas de pedidos
// Todo lo que empiece con '/api/orders' será manejado por 'orderRoutes'
app.use('/api/orders', orderRoutes);

// Le decimos a nuestra app que use las rutas del restaurante
// Todo lo que empiece con '/api/restaurant' será manejado por 'restaurantRoutes'
app.use('/api/restaurant', restaurantRoutes);

// Le decimos a nuestra app que use las rutas del repartidor
// Todo lo que empiece con '/api/delivery' será manejado por 'deliveryRoutes'
app.use('/api/delivery', deliveryRoutes);

// Le decimos a nuestra app que use las rutas de tamaños
// Todo lo que empiece con '/api/sizes' será manejado por 'sizesRoutes'
app.use('/api/sizes', sizesRoutes);


// 6. Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP corriendo en el puerto ${PORT}`);
  console.log(`🔌 Socket.IO habilitado para notificaciones en tiempo real`);
});
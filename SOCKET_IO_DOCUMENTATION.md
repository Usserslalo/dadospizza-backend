# Sistema de Notificaciones en Tiempo Real - Socket.IO

## Descripción General

Este documento describe la implementación del sistema de notificaciones en tiempo real usando Socket.IO en el backend de Dados Pizza. El sistema permite que los clientes, restaurantes y repartidores reciban notificaciones instantáneas sobre cambios en el estado de los pedidos.

## Arquitectura

### Componentes Principales

1. **Servidor HTTP + Socket.IO**: Integrado en `src/server.js`
2. **Configuración de Socket**: `src/config/socket.js`
3. **Controladores con notificaciones**: 
   - `src/controllers/orders.controller.js`
   - `src/controllers/restaurant.controller.js`
   - `src/controllers/delivery.controller.js`

### Flujo de Notificaciones

```
Cliente Flutter → Socket.IO → Servidor → Sala específica → Notificación en tiempo real
```

## Configuración del Servidor

### Puerto y CORS

El servidor Socket.IO está configurado para aceptar conexiones desde cualquier origen (`*`) en desarrollo. En producción, se debe especificar los dominios permitidos.

```javascript
// Configuración en src/server.js
const io = new Server(server, {
  cors: {
    origin: "*", // Cambiar en producción
    methods: ["GET", "POST"]
  }
});

// Configurar Socket.IO
const socketUtils = configureSocket(io);

// Hacer io disponible globalmente para los controladores
global.io = io;
global.socketUtils = socketUtils;
```

## Sistema de Salas (Rooms)

### Tipos de Salas

1. **Salas de Sucursal**: `branch_{id_branch}`
   - Usadas por paneles de restaurante
   - Reciben notificaciones de nuevos pedidos

2. **Salas de Cliente**: `client_{id_client}`
   - Usadas por aplicaciones móviles de clientes
   - Reciben notificaciones de actualizaciones de estado

### Eventos de Conexión

#### Suscribirse a una Sala

```javascript
socket.emit('subscribe', { room: 'branch_1' });
socket.emit('subscribe', { room: 'client_5' });
```

**Respuesta del servidor:**
```javascript
socket.on('subscribed', (data) => {
  console.log(data.message); // "Suscrito exitosamente a la sala branch_1"
  console.log(data.room); // "branch_1"
});
```

#### Desuscribirse de una Sala

```javascript
socket.emit('unsubscribe', { room: 'branch_1' });
```

**Respuesta del servidor:**
```javascript
socket.on('unsubscribed', (data) => {
  console.log(data.message); // "Desuscrito exitosamente de la sala branch_1"
  console.log(data.room); // "branch_1"
});
```

#### Obtener Información de Salas

```javascript
socket.emit('get_rooms');
```

**Respuesta del servidor:**
```javascript
socket.on('rooms_info', (data) => {
  console.log(data.socket_id); // ID del socket
  console.log(data.rooms); // ['socket_id', 'branch_1', 'client_5']
});
```

#### Manejo de Errores

```javascript
socket.on('error', (data) => {
  console.log('Error:', data.message);
  // Posibles mensajes:
  // - "Room es requerido para suscribirse"
  // - "Room es requerido para desuscribirse"
  // - "Error al suscribirse a la sala"
  // - "Error al desuscribirse de la sala"
});
```

## Eventos de Notificación

### 1. Nuevo Pedido (`nuevo_pedido`)

**Emitido por:** `orders.controller.js` - función `createOrder`
**Sala destino:** `branch_{id_branch}`
**Datos incluidos:**

```javascript
{
  id: "123",
  id_client: "456",
  id_branch: "1",
  status: "PAGADO",
  payment_method: "Efectivo",
  subtotal: "25.50",
  delivery_fee: "0.00",
  total: "25.50",
  created_at: "2024-01-15T10:30:00.000Z",
  products_count: 2,
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

**Código de emisión:**
```javascript
// En orders.controller.js
const branchRoom = `branch_${result.order.id_branch.toString()}`;

const orderNotification = {
  id: result.order.id.toString(),
  id_client: result.order.id_client.toString(),
  id_branch: result.order.id_branch.toString(),
  status: result.order.status,
  payment_method: result.order.payment_method,
  subtotal: result.order.subtotal.toString(),
  delivery_fee: result.order.delivery_fee.toString(),
  total: result.order.total.toString(),
  created_at: result.order.created_at,
  products_count: result.orderItems.length,
  timestamp: new Date().toISOString()
};

io.to(branchRoom).emit('nuevo_pedido', orderNotification);
```

**Uso en Flutter:**
```dart
socket.on('nuevo_pedido', (data) {
  // Actualizar lista de pedidos en el panel del restaurante
  print('Nuevo pedido recibido: ${data['id']}');
});
```

### 2. Actualización de Estado (`actualizacion_estado`)

**Emitido por:** 
- `restaurant.controller.js` - función `updateOrderStatus`
- `delivery.controller.js` - función `updateOrderStatus`

**Sala destino:** `client_{id_client}`
**Datos incluidos:**

```javascript
{
  id: "123",
  id_client: "456",
  id_branch: "1",
  id_delivery: "789", // Solo en actualizaciones del repartidor
  status: "EN PREPARACION",
  previous_status: "PAGADO",
  payment_method: "Efectivo",
  subtotal: "25.50",
  delivery_fee: "0.00",
  total: "25.50",
  updated_at: "2024-01-15T10:35:00.000Z",
  client: {
    id: "456",
    name: "Juan",
    lastname: "Pérez",
    phone: "1234567890"
  },
  address: {
    id: "1",
    address: "Calle 123 #45-67",
    neighborhood: "Centro",
    alias: "Casa"
  },
  timestamp: "2024-01-15T10:35:00.000Z"
}
```

**Código de emisión (Restaurante):**
```javascript
// En restaurant.controller.js
const clientRoom = `client_${updatedOrder.id_client.toString()}`;

const statusUpdateNotification = {
  id: updatedOrder.id.toString(),
  id_client: updatedOrder.id_client.toString(),
  id_branch: updatedOrder.id_branch.toString(),
  status: updatedOrder.status,
  previous_status: existingOrder.status,
  payment_method: updatedOrder.payment_method,
  subtotal: updatedOrder.subtotal.toString(),
  delivery_fee: updatedOrder.delivery_fee.toString(),
  total: updatedOrder.total.toString(),
  updated_at: updatedOrder.updated_at,
  client: updatedOrder.users_orders_id_clientTousers,
  address: updatedOrder.address,
  timestamp: new Date().toISOString()
};

io.to(clientRoom).emit('actualizacion_estado', statusUpdateNotification);
```

**Código de emisión (Repartidor):**
```javascript
// En delivery.controller.js
const clientRoom = `client_${updatedOrder.id_client.toString()}`;

const statusUpdateNotification = {
  id: updatedOrder.id.toString(),
  id_client: updatedOrder.id_client.toString(),
  id_delivery: deliveryUserId.toString(),
  status: updatedOrder.status,
  previous_status: currentStatus,
  payment_method: updatedOrder.payment_method,
  subtotal: updatedOrder.subtotal.toString(),
  delivery_fee: updatedOrder.delivery_fee.toString(),
  total: updatedOrder.total.toString(),
  updated_at: updatedOrder.updated_at,
  client: {
    id: updatedOrder.users_orders_id_clientTousers.id,
    name: updatedOrder.users_orders_id_clientTousers.name,
    lastname: updatedOrder.users_orders_id_clientTousers.lastname,
    phone: updatedOrder.users_orders_id_clientTousers.phone
  },
  delivery_address: {
    id: updatedOrder.address.id,
    address: updatedOrder.address.address,
    neighborhood: updatedOrder.address.neighborhood,
    alias: updatedOrder.address.alias
  },
  timestamp: new Date().toISOString()
};

io.to(clientRoom).emit('actualizacion_estado', statusUpdateNotification);
```

**Uso en Flutter:**
```dart
socket.on('actualizacion_estado', (data) {
  // Actualizar estado del pedido en la app del cliente
  print('Estado actualizado: ${data['status']}');
  print('Estado anterior: ${data['previous_status']}');
});
```

## Implementación en Flutter

### Conexión Básica

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;
  
  void connect() {
    socket = IO.io('http://localhost:3000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();
    
    socket.onConnect((_) {
      print('Conectado al servidor');
    });
    
    socket.onDisconnect((_) {
      print('Desconectado del servidor');
    });
  }
  
  void subscribeToBranch(String branchId) {
    socket.emit('subscribe', {'room': 'branch_$branchId'});
  }
  
  void subscribeToClient(String clientId) {
    socket.emit('subscribe', {'room': 'client_$clientId'});
  }
}
```

### Manejo de Eventos

```dart
class OrderNotificationHandler {
  void setupListeners() {
    // Escuchar nuevos pedidos (para restaurantes)
    socket.on('nuevo_pedido', (data) {
      handleNewOrder(data);
    });
    
    // Escuchar actualizaciones de estado (para clientes)
    socket.on('actualizacion_estado', (data) {
      handleStatusUpdate(data);
    });
    
    // Escuchar confirmaciones de suscripción
    socket.on('subscribed', (data) {
      print('Suscrito a: ${data['room']}');
    });
  }
  
  void handleNewOrder(Map<String, dynamic> data) {
    // Lógica para manejar nuevo pedido
    print('Nuevo pedido: ${data['id']}');
  }
  
  void handleStatusUpdate(Map<String, dynamic> data) {
    // Lógica para manejar actualización de estado
    print('Estado actualizado: ${data['status']}');
  }
}
```

## Estados de Pedidos

### Flujo Completo

1. **PAGADO** → Cliente crea pedido → Notificación a sucursal
2. **EN PREPARACION** → Restaurante actualiza → Notificación a cliente
3. **DESPACHADO** → Restaurante actualiza → Notificación a cliente
4. **EN CAMINO** → Repartidor actualiza → Notificación a cliente
5. **ENTREGADO** → Repartidor actualiza → Notificación a cliente

## Manejo de Errores

### Errores de Conexión

```dart
socket.onConnectError((error) {
  print('Error de conexión: $error');
});

socket.onError((error) {
  print('Error de socket: $error');
});
```

### Errores del Servidor

```dart
socket.on('error', (data) {
  print('Error del servidor: ${data['message']}');
});
```

## Consideraciones de Producción

### Seguridad

1. **CORS**: Configurar dominios específicos en lugar de `*`
2. **Autenticación**: Implementar middleware de autenticación para Socket.IO
3. **Rate Limiting**: Limitar conexiones por IP

### Escalabilidad

1. **Redis Adapter**: Para múltiples instancias del servidor
2. **Load Balancing**: Distribuir conexiones entre servidores
3. **Monitoreo**: Implementar métricas de conexiones y eventos

### Ejemplo de Configuración de Producción

```javascript
const io = new Server(server, {
  cors: {
    origin: ["https://app.dadospizza.com", "https://admin.dadospizza.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
```

## Testing

### Pruebas Básicas

```javascript
// Test de conexión
const client = io('http://localhost:3000');

client.on('connect', () => {
  console.log('Conectado');
  
  // Test de suscripción
  client.emit('subscribe', { room: 'branch_1' });
  
  // Test de desuscripción
  setTimeout(() => {
    client.emit('unsubscribe', { room: 'branch_1' });
  }, 5000);
});
```

## Funciones de Utilidad

El sistema incluye funciones de utilidad para manejo avanzado de Socket.IO:

```javascript
// Funciones disponibles en global.socketUtils
const { emitToRoom, emitToRooms, getConnectionStats } = global.socketUtils;

// Emitir a una sala específica
emitToRoom('branch_1', 'nuevo_pedido', orderData);

// Emitir a múltiples salas
emitToRooms(['branch_1', 'branch_2'], 'notificacion_general', data);

// Obtener estadísticas de conexiones
const stats = getConnectionStats();
console.log(stats);
// {
//   total_connections: 15,
//   rooms: ['socket_id_1', 'socket_id_2', 'branch_1', 'client_5']
// }
```

## Logs y Debugging

El servidor incluye logs detallados para debugging:

```
🔌 Socket.IO configurado correctamente
👤 Cliente conectado: abc123
📡 Socket abc123 se unió a la sala: branch_1
📢 Evento 'nuevo_pedido' enviado a la sala 'branch_1'
👋 Cliente desconectado: abc123, razón: client namespace disconnect
❌ Error en socket abc123: [error details]
```

## Conclusión

El sistema de notificaciones en tiempo real está completamente implementado y listo para ser integrado con las aplicaciones Flutter. Proporciona una experiencia de usuario fluida y actualizaciones instantáneas para todos los actores del sistema de pedidos.

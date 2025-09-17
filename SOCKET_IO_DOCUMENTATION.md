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
const io = new Server(server, {
  cors: {
    origin: "*", // Cambiar en producción
    methods: ["GET", "POST"]
  }
});
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
});
```

#### Obtener Información de Salas

```javascript
socket.emit('get_rooms');
```

**Respuesta del servidor:**
```javascript
socket.on('rooms_info', (data) => {
  console.log(data.rooms); // ['socket_id', 'branch_1', 'client_5']
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
  status: "EN_PREPARACION",
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
2. **EN_PREPARACION** → Restaurante actualiza → Notificación a cliente
3. **DESPACHADO** → Restaurante actualiza → Notificación a cliente
4. **EN_CAMINO** → Repartidor actualiza → Notificación a cliente
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

## Logs y Debugging

El servidor incluye logs detallados para debugging:

```
🔌 Socket.IO configurado correctamente
👤 Cliente conectado: abc123
📡 Socket abc123 se unió a la sala: branch_1
📢 Notificación 'nuevo_pedido' enviada a la sala: branch_1
👋 Cliente desconectado: abc123, razón: client namespace disconnect
```

## Conclusión

El sistema de notificaciones en tiempo real está completamente implementado y listo para ser integrado con las aplicaciones Flutter. Proporciona una experiencia de usuario fluida y actualizaciones instantáneas para todos los actores del sistema de pedidos.

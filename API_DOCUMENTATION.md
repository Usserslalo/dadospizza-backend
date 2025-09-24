# API Documentation - Dados Pizza Backend

## 🗄️ Configuración de Base de Datos

### Compatibilidad con MySQL

Este backend está configurado para trabajar con **MySQL 8.0+** como base de datos principal. El schema de Prisma está optimizado para MySQL y no incluye anotaciones específicas de PostgreSQL.

#### Schema de Prisma - MySQL Compatible

El archivo `prisma/schema.prisma` está configurado correctamente para MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### Tipos de Datos Optimizados para MySQL

- **Coordenadas geográficas**: Los campos `lat` y `lng` en los modelos `address` y `branches` están definidos como `Float` sin anotaciones específicas de base de datos, lo que los hace compatibles con MySQL.

```prisma
model address {
  lat          Float    // Compatible con MySQL
  lng          Float    // Compatible con MySQL
}

model branches {
  lat        Float?     // Compatible con MySQL
  lng        Float?     // Compatible con MySQL
}
```

#### Configuración Requerida

1. **Variables de Entorno**:
   ```env
   DATABASE_URL="mysql://usuario:password@localhost:3306/dadospizza"
   JWT_SECRET="tu_clave_secreta_jwt"
   ```

2. **Generar Cliente de Prisma**:
   ```bash
   npx prisma generate
   ```

3. **Aplicar Migraciones**:
   ```bash
   npx prisma db push
   # o
   npx prisma migrate dev
   ```

#### Características de la Base de Datos

- **Motor**: MySQL 8.0+
- **ORM**: Prisma Client
- **Migraciones**: Automáticas con Prisma
- **Tipos de datos**: Optimizados para MySQL (BigInt, Decimal, Float, etc.)
- **Relaciones**: Foreign keys con cascada para integridad referencial
- **Índices**: Configurados automáticamente por Prisma

#### Solución BigInt para JSON

El servidor incluye una configuración especial para manejar BigInt en respuestas JSON:

```javascript
// Solución para el error de BigInt
BigInt.prototype.toJSON = function() {
  return this.toString();
};
```

---

## Endpoints de Usuarios

### 1. Registro de Usuarios

**POST** `/api/users/register`

Registra un nuevo usuario en el sistema y le asigna automáticamente el rol de 'CLIENTE'.

#### Parámetros de Entrada

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | Sí | Correo electrónico del usuario (debe ser único) |
| name | string | Sí | Nombre del usuario |
| lastname | string | Sí | Apellido del usuario |
| phone | string | Sí | Teléfono del usuario (debe ser único) |
| password | string | Sí | Contraseña del usuario (se encripta automáticamente) |

#### Ejemplo de Petición

```json
POST /api/users/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "name": "Juan",
  "lastname": "Pérez",
  "phone": "1234567890",
  "password": "miPassword123"
}
```

#### Respuestas

##### Éxito (201 Created)
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "1",
    "email": "usuario@ejemplo.com",
    "name": "Juan",
    "lastname": "Pérez",
    "phone": "1234567890",
    "role": "CLIENTE",
    "id_branch": null,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

##### Error - Campos Faltantes (400 Bad Request)
```json
{
  "error": "Todos los campos son obligatorios: email, name, lastname, phone, password"
}
```

##### Error - Usuario Ya Existe (400 Bad Request)
```json
{
  "error": "El correo o teléfono ya están registrados"
}
```

##### Error - Servidor (500 Internal Server Error)
```json
{
  "error": "Error interno del servidor al crear el usuario"
}
```

#### Características de Seguridad

- ✅ Las contraseñas se encriptan usando bcryptjs con salt de 10 rondas
- ✅ Validación de unicidad de email y teléfono
- ✅ Transacciones de base de datos para garantizar consistencia
- ✅ Asignación automática del rol 'CLIENTE'
- ✅ Validación de campos requeridos

#### Notas Técnicas

- El endpoint utiliza transacciones de Prisma para garantizar que tanto la creación del usuario como la asignación del rol se completen exitosamente
- Las contraseñas nunca se devuelven en las respuestas por seguridad
- El sistema verifica automáticamente que el rol 'CLIENTE' existe en la base de datos

---

### 2. Inicio de Sesión (Login)

### POST /api/users/login

Autentica a un usuario existente y devuelve un token JWT para futuras peticiones autenticadas.

#### Parámetros de Entrada

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | Sí | Correo electrónico del usuario |
| password | string | Sí | Contraseña del usuario |

#### Ejemplo de Petición

```json
POST /api/users/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"
}
```

#### Respuestas

##### Éxito (200 OK)
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwNTMxMjAwMCwiZXhwIjoxNzA1Mzk4NDAwfQ.example_signature",
  "user": {
    "id": "1",
    "email": "usuario@ejemplo.com",
    "name": "Juan",
    "lastname": "Pérez",
    "phone": "1234567890",
    "role": "CLIENTE",
    "id_branch": null
  }
}
```

##### Error - Campos Faltantes (400 Bad Request)
```json
{
  "error": "Email y contraseña son obligatorios"
}
```

##### Error - Credenciales Inválidas (401 Unauthorized)
```json
{
  "error": "Credenciales inválidas"
}
```

##### Error - Servidor (500 Internal Server Error)
```json
{
  "error": "Error interno del servidor al iniciar sesión"
}
```

#### Características de Seguridad

- ✅ Verificación segura de contraseñas usando bcryptjs
- ✅ Mensaje genérico de error para no revelar si el email existe
- ✅ Tokens JWT con expiración de 24 horas
- ✅ Firma de tokens con clave secreta (JWT_SECRET)
- ✅ No se devuelve la contraseña en la respuesta

#### Uso del Token JWT

Una vez obtenido el token, inclúyelo en el header `Authorization` de las peticiones autenticadas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Notas Técnicas

- El token JWT contiene el ID del usuario en el payload (`{ userId: user.id }`)
- El token expira automáticamente después de 24 horas
- Para mayor seguridad, se recomienda almacenar el token de forma segura en el cliente
- El endpoint utiliza mensajes de error genéricos para evitar ataques de enumeración de usuarios

## 🔐 Obtener Perfil de Usuario (Protegido)

### `GET /api/users/profile`

Obtiene el perfil del usuario actualmente autenticado.

**Headers requeridos:**
```
Authorization: Bearer <token_jwt>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "user": {
    "id": "1",
    "email": "usuario@ejemplo.com",
    "name": "Juan",
    "lastname": "Pérez",
    "phone": "1234567890",
    "role": "CLIENTE",
    "id_branch": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Posibles errores:**

**401 Unauthorized - Token requerido:**
```json
{
  "error": "Token de autorización requerido. Incluya el header Authorization con formato Bearer <token>"
}
```

**401 Unauthorized - Token inválido:**
```json
{
  "error": "Token inválido"
}
```

**401 Unauthorized - Token expirado:**
```json
{
  "error": "Token expirado. Por favor, inicie sesión nuevamente"
}
```

**404 Not Found:**
```json
{
  "error": "Usuario no encontrado"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error interno del servidor al obtener el perfil"
}
```

**Características de seguridad:**
- El endpoint requiere autenticación mediante JWT
- La contraseña del usuario nunca se incluye en la respuesta
- Solo se devuelven los campos necesarios del perfil
- Manejo robusto de errores de token (inválido, expirado, faltante)

---

## 📍 Gestión de Direcciones

### 1. Crear Nueva Dirección
**POST** `/api/addresses`

Crea una nueva dirección para el usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "address": "Calle 123 #45-67",
  "neighborhood": "Centro",
  "lat": 4.6097100,
  "lng": -74.0817500,
  "alias": "Casa" // Opcional
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Dirección creada exitosamente",
  "data": {
    "id": "1",
    "id_user": "1",
    "address": "Calle 123 #45-67",
    "neighborhood": "Centro",
    "alias": "Casa",
    "lat": 4.60971,
    "lng": -74.08175,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Campos requeridos faltantes o datos inválidos
- `401`: Token de autorización inválido o faltante
- `500`: Error interno del servidor

### 2. Obtener Direcciones del Usuario
**GET** `/api/addresses`

Obtiene todas las direcciones del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Direcciones obtenidas exitosamente",
  "data": [
    {
      "id": "1",
      "id_user": "1",
      "address": "Calle 123 #45-67",
      "neighborhood": "Centro",
      "alias": "Casa",
      "lat": 4.60971,
      "lng": -74.08175,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Errores posibles:**
- `401`: Token de autorización inválido o faltante
- `500`: Error interno del servidor

### 3. Actualizar Dirección
**PUT** `/api/addresses/:id`

Actualiza una dirección existente del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de URL:**
- `id`: ID de la dirección a actualizar

**Body (todos los campos son opcionales):**
```json
{
  "address": "Calle 123 #45-67",
  "neighborhood": "Centro",
  "lat": 4.6097100,
  "lng": -74.0817500,
  "alias": "Casa"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Dirección actualizada exitosamente",
  "data": {
    "id": "1",
    "id_user": "1",
    "address": "Calle 123 #45-67",
    "neighborhood": "Centro",
    "alias": "Casa",
    "lat": 4.60971,
    "lng": -74.08175,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: ID inválido o datos inválidos
- `401`: Token de autorización inválido o faltante
- `404`: Dirección no encontrada o sin permisos
- `500`: Error interno del servidor

### 4. Eliminar Dirección
**DELETE** `/api/addresses/:id`

Elimina una dirección del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros de URL:**
- `id`: ID de la dirección a eliminar

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Dirección eliminada correctamente"
}
```

**Errores posibles:**
- `400`: ID inválido
- `401`: Token de autorización inválido o faltante
- `404`: Dirección no encontrada o sin permisos
- `500`: Error interno del servidor

**Características de seguridad de direcciones:**
- Todos los endpoints requieren autenticación mediante JWT
- Los usuarios solo pueden gestionar sus propias direcciones
- Verificación de pertenencia en operaciones de actualización y eliminación
- Validación robusta de datos de entrada (coordenadas, campos requeridos)
- Manejo seguro de tipos BigInt para compatibilidad con MySQL

---

## 🍕 Catálogo de Productos

### 1. Obtener Todos los Productos
**GET** `/api/products`

Obtiene todos los productos disponibles en el catálogo. Este endpoint es público y no requiere autenticación.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Pizza Margherita",
      "description": "Pizza clásica con tomate, mozzarella y albahaca",
      "price": null,
      "id_category": "1",
      "is_available": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "categories": {
        "id": "1",
        "name": "Pizzas",
        "description": "Pizzas artesanales"
      },
      "product_images": [
        {
          "id": "1",
          "id_product": "1",
          "image_url": "https://ejemplo.com/pizza-margherita.jpg"
        }
      ]
    },
    {
      "id": "2",
      "name": "Coca Cola",
      "description": "Bebida gaseosa 350ml",
      "price": "8.50",
      "id_category": "2",
      "is_available": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "categories": {
        "id": "2",
        "name": "Bebidas",
        "description": "Bebidas frías y calientes"
      },
      "product_images": [
        {
          "id": "2",
          "id_product": "2",
          "image_url": "https://ejemplo.com/coca-cola.jpg"
        }
      ]
    }
  ]
}
```

**Errores posibles:**
- `500`: Error interno del servidor

### 2. Obtener Productos por Categoría
**GET** `/api/categories/:id/products`

Obtiene todos los productos de una categoría específica. Este endpoint es público y no requiere autenticación.

**Parámetros de URL:**
- `id`: ID de la categoría

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Pizza Margherita",
      "description": "Pizza clásica con tomate, mozzarella y albahaca",
      "price": null,
      "id_category": "1",
      "is_available": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "categories": {
        "id": "1",
        "name": "Pizzas",
        "description": "Pizzas artesanales"
      },
      "product_images": [
        {
          "id": "1",
          "id_product": "1",
          "image_url": "https://ejemplo.com/pizza-margherita.jpg"
        }
      ]
    }
  ]
}
```

**Errores posibles:**
- `400`: ID de categoría inválido
- `500`: Error interno del servidor

### 3. Obtener Detalle de Producto
**GET** `/api/products/:id`

Obtiene el detalle completo de un producto específico. Este endpoint maneja la lógica de precios fijos y variables. Es público y no requiere autenticación.

**Parámetros de URL:**
- `id`: ID del producto

#### Respuesta para Producto con Precio Fijo (Bebidas, Megamix, etc.)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Coca Cola",
    "description": "Bebida gaseosa 350ml",
    "price": "8.50",
    "category": {
      "id": "2",
      "name": "Bebidas",
      "description": "Bebidas frías y calientes"
    },
    "images": [
      {
        "id": "2",
        "id_product": "2",
        "image_url": "https://ejemplo.com/coca-cola.jpg"
      }
    ],
    "is_available": true
  }
}
```

#### Respuesta para Producto con Precios Variables (Pizzas)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Pizza Hawaiana",
    "description": "Pizza con jamón y piña",
    "prices": [
      {
        "id": "1",
        "size": "Personal",
        "price": "75.00"
      },
      {
        "id": "2",
        "size": "Mediana",
        "price": "160.00"
      },
      {
        "id": "3",
        "size": "Grande",
        "price": "180.00"
      },
      {
        "id": "4",
        "size": "Familiar",
        "price": "210.00"
      },
      {
        "id": "5",
        "size": "Cuadrada",
        "price": "245.00"
      }
    ],
    "category": {
      "id": 1,
      "name": "Pizzas",
      "description": "Pizzas artesanales"
    },
    "images": [
      {
        "id": 1,
        "id_product": 1,
        "image_url": "https://ejemplo.com/pizza-hawaiana.jpg"
      }
    ],
    "is_available": true
  }
}
```

**Errores posibles:**
- `400`: ID de producto inválido
- `404`: Producto no encontrado
- `500`: Error interno del servidor

**Características del catálogo de productos:**
- Todos los endpoints son públicos (no requieren autenticación)
- Solo se muestran productos disponibles (`is_available: true`)
- Manejo inteligente de precios: fijos para bebidas/Megamix, variables para pizzas
- Incluye información completa de categorías e imágenes
- Respuestas optimizadas para consumo de aplicaciones cliente
- Validación robusta de parámetros de entrada

---

## 📂 Endpoints de Categorías

### GET /api/categories
**Obtener todas las categorías**

Obtiene todas las categorías de productos disponibles en el sistema.

**Autenticación:** No requerida (público)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Premium",
      "description": "Nuestras pizzas más completas y con más ingredientes.",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Tradicional",
      "description": "Los sabores clásicos que nunca fallan.",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Errores posibles:**
- `500`: Error interno del servidor

---

## 📏 Endpoints de Tamaños

### GET /api/sizes
**Obtener todos los tamaños**

Obtiene todos los tamaños disponibles para los productos.

**Autenticación:** No requerida (público)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Personal",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Mediana",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 3,
      "name": "Grande",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 4,
      "name": "Familiar",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 5,
      "name": "Cuadrada",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /api/sizes/:id
**Obtener un tamaño por ID**

Obtiene información detallada de un tamaño específico.

**Autenticación:** No requerida (público)

**Parámetros de URL:**
- `id`: ID del tamaño

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Personal",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: ID de tamaño inválido
- `404`: Tamaño no encontrado
- `500`: Error interno del servidor

---

## 🛒 Gestión de Pedidos

### POST /api/orders
**Crear un nuevo pedido**

Crea un pedido completo con cálculo de precios en el servidor para garantizar la integridad y seguridad de los datos.

**Autenticación:** Requerida (Bearer Token)
**Middleware:** `authMiddleware`

**Body de la petición:**
```json
{
  "id_address": 1,
  "id_branch": 1,
  "payment_method": "Efectivo",
  "products": [
    {
      "id_product": 7,
      "quantity": 1,
      "id_size": 3,
      "addons": [2]
    },
    {
      "id_product": 19, // ID del Refresco 2lts
      "quantity": 2
    }
  ]
}
```

**Parámetros:**
- `id_address` (BigInt, requerido): ID de la dirección de entrega
- `id_branch` (BigInt, requerido): ID de la sucursal
- `payment_method` (String, opcional): Método de pago (default: "Efectivo")
- `products` (Array, requerido): Lista de productos del pedido
  - `id_product` (BigInt, requerido): ID del producto
  - `quantity` (Int, requerido): Cantidad del producto
  - `id_size` (BigInt, opcional): ID del tamaño (requerido para pizzas)
  - `addons` (Array, opcional): Lista de IDs de addons

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "data": {
    "order_id": "1",
    "subtotal": "311.00",
    "delivery_fee": "0.00",
    "total": "311.00",
    "status": "PAGADO",
    "payment_method": "Efectivo",
    "products_count": 2,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Campos requeridos faltantes o inválidos
- `400`: Producto no encontrado o no disponible
- `400`: Precio no encontrado para el tamaño especificado
- `400`: Addon no encontrado
- `400`: Referencia a registro inexistente
- `401`: Token de autorización inválido o expirado
- `500`: Error interno del servidor

**Características del sistema de pedidos:**
- **Cálculo de precios en el servidor:** Todos los precios se calculan en el backend para garantizar la integridad
- **Transacciones atómicas:** Uso de transacciones de base de datos para garantizar consistencia
- **Manejo inteligente de precios:** Soporte para productos con precio fijo y variable
- **Sistema de addons:** Soporte completo para extras con precios por tamaño
- **Validación robusta:** Verificación de existencia y disponibilidad de todos los elementos
- **Seguridad:** Autenticación obligatoria y validación de permisos
- **Trazabilidad:** Registro completo de precios al momento de la compra
- **Notificaciones en tiempo real:** Emisión automática de eventos Socket.IO a la sucursal correspondiente

### GET /api/orders/my-history
**Obtener historial de pedidos del usuario**

Obtiene el historial completo de pedidos del usuario autenticado con toda la información relacionada.

**Autenticación:** Requerida (Bearer Token)
**Middleware:** `authMiddleware`, `checkRole('CLIENTE')`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Historial de pedidos obtenido exitosamente",
  "data": [
    {
      "id": "1",
      "status": "ENTREGADO",
      "payment_method": "Efectivo",
      "subtotal": "180.00",
      "delivery_fee": "0.00",
      "total": "180.00",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T12:00:00.000Z",
      "address": {
        "id": "1",
        "address": "Calle Principal 123",
        "neighborhood": "Centro",
        "alias": "Casa",
        "lat": 20.484123,
        "lng": -99.216345
      },
      "branches": {
        "id": "1",
        "name": "Dados Pizza - Matriz Ixmiquilpan",
        "address": "Av. Insurgentes Ote. 75, Centro, 42300 Ixmiquilpan, Hgo.",
        "phone": "7711234567"
      },
      "order_has_products": [
        {
          "id": "1",
          "quantity": 1,
          "price_per_unit": "180.00",
          "products": {
            "id": "1",
            "name": "Mexicana",
            "description": "Jamon, salami, tocino, chorizo, champiñones, pimiento morron, cebolla y jalapeño"
          },
          "sizes": {
            "id": "2",
            "name": "Mediana"
          },
          "order_item_addons": [
            {
              "id": "1",
              "price_at_purchase": "18.00",
              "addons": {
                "id": "1",
                "name": "Ingrediente Extra"
              }
            }
          ]
        }
      ]
    }
  ],
  "count": 1
}
```

**Errores posibles:**
- `401`: Token de autorización inválido o faltante
- `403`: Usuario sin rol CLIENTE
- `500`: Error interno del servidor

---

## 🏪 Gestión del Restaurante (Rol RESTAURANTE)

### Autenticación y Autorización

Todos los endpoints del restaurante requieren:
1. **Autenticación**: Token JWT válido en el header `Authorization: Bearer <token>`
2. **Autorización**: Usuario con rol `RESTAURANTE`
3. **Asociación**: Usuario debe estar asociado a una sucursal (`id_branch`)

### ⚠️ Configuración Requerida

**IMPORTANTE**: Antes de usar los endpoints del restaurante, asegúrate de que:

1. **Schema de Prisma actualizado**: El campo `id_branch` debe estar presente en el modelo `users`
2. **Cliente de Prisma regenerado**: Ejecuta `npx prisma generate` después de actualizar el schema
3. **Usuario con rol RESTAURANTE**: El usuario debe tener el rol correcto y estar asociado a una sucursal

**Verificar configuración:**
```sql
-- Verificar que el usuario tiene el rol y sucursal correctos
SELECT 
    u.email,
    u.name,
    u.id_branch,
    b.name as branch_name,
    r.name as role_name
FROM users u
LEFT JOIN branches b ON u.id_branch = b.id
JOIN user_has_roles uhr ON u.id = uhr.id_user
JOIN roles r ON uhr.id_rol = r.id
WHERE u.email = 'tu_usuario@ejemplo.com';
```

### 1. Obtener Pedidos por Estado
**GET** `/api/restaurant/orders`

Obtiene los pedidos de la sucursal del empleado, con filtrado opcional por estado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (opcional): Estado del pedido a filtrar
  - Valores válidos: `PAGADO`, `EN PREPARACION`, `DESPACHADO`, `EN CAMINO`, `ENTREGADO`, `CANCELADO`
  - Si no se especifica, devuelve todos los pedidos de la sucursal

**Ejemplos de uso:**
- `GET /api/restaurant/orders` - Todos los pedidos
- `GET /api/restaurant/orders?status=PAGADO` - Solo pedidos pagados
- `GET /api/restaurant/orders?status=EN PREPARACION` - Solo pedidos en preparación

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Pedidos con estado PAGADO obtenidos exitosamente",
  "data": [
    {
      "id": "1",
      "id_client": "5",
      "id_delivery": null,
      "id_address": "3",
      "id_branch": "1",
      "status": "PAGADO",
      "payment_method": "Efectivo",
      "subtotal": "180.00",
      "delivery_fee": "0.00",
      "total": "180.00",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "client": {
        "id": "5",
        "name": "María",
        "lastname": "García",
        "phone": "9876543210",
        "email": "maria@ejemplo.com"
      },
      "address": {
        "id": "3",
        "address": "Calle 456 #78-90",
        "neighborhood": "Norte",
        "alias": "Oficina",
        "lat": 4.6097100,
        "lng": -74.0817500
      },
      "branch": {
        "id": "1",
        "name": "Sucursal Centro",
        "address": "Carrera 7 #32-16",
        "phone": "601-555-0123"
      },
      "products": [
        {
          "id": "1",
          "id_product": "7",
          "id_size": "3",
          "quantity": 1,
          "price_per_unit": "180.00",
          "product": {
            "id": "7",
            "name": "Pizza Hawaiana",
            "description": "Pizza con jamón y piña"
          },
          "size": {
            "id": "3",
            "name": "Grande"
          },
          "addons": [
            {
              "id": "1",
              "id_addon": "2",
              "price_at_purchase": "15.00",
              "addon": {
                "id": "2",
                "name": "Extra Queso"
              }
            }
          ]
        }
      ]
    }
  ],
  "filters": {
    "branch_id": "1",
    "status": "PAGADO"
  }
}
```

**Errores posibles:**
- `400`: Usuario no asociado a ninguna sucursal
- `401`: Token de autorización inválido o faltante
- `403`: Usuario sin rol RESTAURANTE
- `500`: Error interno del servidor

**Errores comunes y soluciones:**
- **"Unknown field id_branch"**: El schema de Prisma no está actualizado. Ejecuta `npx prisma generate`
- **"Invalid orders_status"**: El estado no está en el formato correcto. Usa los valores exactos listados arriba

### 2. Actualizar Estado del Pedido
**PUT** `/api/restaurant/orders/:id/status`

Actualiza el estado de un pedido específico de la sucursal del empleado.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de URL:**
- `id`: ID del pedido a actualizar

**Body:**
```json
{
  "status": "EN PREPARACION"
}
```

**Estados válidos:**
- `PAGADO`
- `EN PREPARACION`
- `DESPACHADO`
- `EN CAMINO`
- `ENTREGADO`
- `CANCELADO`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del pedido actualizado exitosamente a EN PREPARACION",
  "data": {
    "id": "1",
    "id_client": "5",
    "id_address": "3",
    "id_branch": "1",
    "status": "EN PREPARACION",
    "payment_method": "Efectivo",
    "subtotal": "180.00",
    "delivery_fee": "0.00",
    "total": "180.00",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:15:00.000Z",
    "client": {
      "id": "5",
      "name": "María",
      "lastname": "García",
      "phone": "9876543210"
    },
    "address": {
      "id": "3",
      "address": "Calle 456 #78-90",
      "neighborhood": "Norte",
      "alias": "Oficina"
    },
    "products": [
      {
        "id": "1",
        "quantity": 1,
        "price_per_unit": "180.00",
        "product": {
          "id": "7",
          "name": "Pizza Hawaiana"
        },
        "size": {
          "id": "3",
          "name": "Grande"
        }
      }
    ]
  }
}
```

**Errores posibles:**
- `400`: Estado inválido, ID inválido, o usuario no asociado a sucursal
- `401`: Token de autorización inválido o faltante
- `403`: Usuario sin rol RESTAURANTE
- `404`: Pedido no encontrado o sin permisos para modificarlo
- `500`: Error interno del servidor

**Errores comunes y soluciones:**
- **"Invalid value for argument status"**: El estado debe usar exactamente el formato con espacios: `"EN PREPARACION"`
- **"Unknown field id_branch"**: El schema de Prisma no está actualizado. Ejecuta `npx prisma generate`

**Características de seguridad del módulo restaurante:**
- **Autorización por rol**: Solo usuarios con rol RESTAURANTE pueden acceder
- **Segmentación por sucursal**: Los empleados solo ven/modifican pedidos de su sucursal
- **Validación de pertenencia**: Verificación estricta antes de cualquier modificación
- **Estados controlados**: Solo se permiten transiciones de estado válidas
- **Auditoría completa**: Registro de cambios de estado con timestamps
- **Información detallada**: Respuestas incluyen datos completos del cliente, dirección y productos

**Flujo típico de trabajo del restaurante:**
1. Empleado obtiene pedidos con estado `PAGADO` para comenzar preparación
2. Actualiza estado a `EN PREPARACION` cuando inicia la preparación
3. Actualiza a `DESPACHADO` cuando el pedido está listo para entrega
4. El sistema de entrega se encarga de `EN CAMINO` y `ENTREGADO`

### 🔧 Troubleshooting del Módulo Restaurante

**Problema 1: Error "Unknown field id_branch"**
```bash
# Solución: Regenerar el cliente de Prisma
npx prisma generate
npm run dev
```

**Problema 2: Error "Invalid value for argument status"**
- Asegúrate de usar exactamente estos valores (con espacios):
- `"EN PREPARACION"` ✅
- `"EN CAMINO"` ✅
- NO usar: `"EN_PREPARACION"` ❌

**Problema 3: Error "Usuario no asociado a ninguna sucursal"**
```sql
-- Verificar que el usuario tiene id_branch asignado
SELECT email, id_branch FROM users WHERE email = 'tu_usuario@ejemplo.com';

-- Asignar sucursal si es necesario
UPDATE users SET id_branch = 1 WHERE email = 'tu_usuario@ejemplo.com';
```

**Problema 4: Error 403 "Acceso denegado"**
```sql
-- Verificar que el usuario tiene el rol RESTAURANTE
SELECT 
    u.email,
    r.name as role_name
FROM users u
JOIN user_has_roles uhr ON u.id = uhr.id_user
JOIN roles r ON uhr.id_rol = r.id
WHERE u.email = 'tu_usuario@ejemplo.com';
```

**Problema 5: Contraseña incorrecta en login**
- Si creaste el usuario directamente en BD, necesitas la contraseña original o actualizarla:
```sql
-- Actualizar contraseña (usa bcrypt para encriptar)
UPDATE users 
SET password = '$2a$10$nueva_contraseña_encriptada', 
    updated_at = NOW() 
WHERE email = 'tu_usuario@ejemplo.com';
```

---

## 🔐 Sistema de Roles y Permisos

### Roles Disponibles
- **CLIENTE**: Puede crear pedidos, gestionar direcciones, ver perfil
- **RESTAURANTE**: Puede ver y gestionar pedidos de su sucursal
- **ADMIN**: Acceso completo al sistema (pendiente de implementación)
- **DELIVERY**: Gestión de entregas (pendiente de implementación)

### Gestión de Usuarios y Roles

#### Crear Usuario con Rol Específico

El endpoint de registro automáticamente asigna el rol `CLIENTE`. Para crear usuarios con otros roles (como empleados del restaurante), necesitas realizar las siguientes operaciones en la base de datos:

**1. Crear el Usuario Base**
```sql
-- Insertar el usuario en la tabla users
INSERT INTO users (email, name, lastname, phone, password, id_branch, created_at, updated_at) 
VALUES (
    'empleado@sucursal1.com', 
    'Carlos', 
    'Rodríguez', 
    '3001234567', 
    '$2a$10$ejemplo_hash_password', -- Contraseña encriptada con bcrypt
    1, -- ID de la sucursal (opcional para empleados)
    NOW(), 
    NOW()
);
```

**2. Asignar Rol Específico**
```sql
-- Obtener el ID del rol RESTAURANTE
SELECT id FROM roles WHERE name = 'RESTAURANTE';

-- Asignar el rol al usuario (usar el ID obtenido en el paso anterior)
INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at) 
VALUES (
    LAST_INSERT_ID(), -- ID del usuario creado
    2, -- ID del rol RESTAURANTE (ajustar según tu base de datos)
    NOW(), 
    NOW()
);
```

#### Script Completo para Crear Empleado de Restaurante

```sql
-- Paso 1: Crear el usuario empleado
INSERT INTO users (
    email, 
    name, 
    lastname, 
    phone, 
    password, 
    id_branch, 
    created_at, 
    updated_at
) VALUES (
    'maria.chef@sucursal1.com', 
    'María', 
    'García', 
    '3009876543', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvO9cGX3K9LqJm8vF9K2x3Y4Z5A', -- "password123" encriptada
    1, -- Sucursal Centro
    NOW(), 
    NOW()
);

-- Paso 2: Obtener el ID del usuario recién creado
SET @user_id = LAST_INSERT_ID();

-- Paso 3: Obtener el ID del rol RESTAURANTE
SET @role_id = (SELECT id FROM roles WHERE name = 'RESTAURANTE');

-- Paso 4: Asignar el rol al usuario
INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at) 
VALUES (@user_id, @role_id, NOW(), NOW());
```

#### Verificar Usuario y Roles

```sql
-- Verificar que el usuario fue creado correctamente
SELECT 
    u.id,
    u.email,
    u.name,
    u.lastname,
    u.id_branch,
    b.name as branch_name,
    r.name as role_name
FROM users u
LEFT JOIN branches b ON u.id_branch = b.id
JOIN user_has_roles uhr ON u.id = uhr.id_user
JOIN roles r ON uhr.id_rol = r.id
WHERE u.email = 'maria.chef@sucursal1.com';
```

#### Crear Usuario SIN Asociación a Sucursal

Para crear usuarios que no estén asociados a una sucursal específica (como administradores):

```sql
-- Crear usuario sin sucursal
INSERT INTO users (
    email, 
    name, 
    lastname, 
    phone, 
    password, 
    id_branch, -- NULL para usuarios sin sucursal
    created_at, 
    updated_at
) VALUES (
    'admin@dadospizza.com', 
    'Admin', 
    'Sistema', 
    '3000000000', 
    '$2a$10$ejemplo_hash_password', 
    NULL, -- Sin sucursal
    NOW(), 
    NOW()
);

-- Asignar rol ADMIN (cuando esté implementado)
SET @admin_user_id = LAST_INSERT_ID();
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'ADMIN');

INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at) 
VALUES (@admin_user_id, @admin_role_id, NOW(), NOW());
```

#### Actualizar Sucursal de Usuario Existente

```sql
-- Cambiar la sucursal de un empleado
UPDATE users 
SET id_branch = 2, updated_at = NOW() 
WHERE email = 'empleado@sucursal1.com';
```

#### Asignar Múltiples Roles a un Usuario

```sql
-- Un usuario puede tener múltiples roles (ej: ADMIN y RESTAURANTE)
SET @user_id = (SELECT id FROM users WHERE email = 'supervisor@dadospizza.com');

-- Asignar rol RESTAURANTE
INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at) 
VALUES (@user_id, (SELECT id FROM roles WHERE name = 'RESTAURANTE'), NOW(), NOW());

-- Asignar rol ADMIN (si existe)
INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at) 
VALUES (@user_id, (SELECT id FROM roles WHERE name = 'ADMIN'), NOW(), NOW());
```

### Estructura de la Base de Datos para Roles

**Tabla `roles`:**
```sql
-- Ver roles disponibles
SELECT * FROM roles;

-- Resultado esperado:
-- id | name        | image | route
-- 1  | CLIENTE     | null  | /client
-- 2  | RESTAURANTE | null  | /restaurant  
-- 3  | ADMIN       | null  | /admin
-- 4  | DELIVERY    | null  | /delivery
```

**Tabla `user_has_roles`:**
```sql
-- Ver asignaciones de roles
SELECT 
    u.email,
    u.name,
    r.name as role_name,
    u.id_branch
FROM users u
JOIN user_has_roles uhr ON u.id = uhr.id_user
JOIN roles r ON uhr.id_rol = r.id
ORDER BY u.email;
```

### Consideraciones Importantes

1. **Encriptación de Contraseñas**: Siempre usa bcrypt para encriptar contraseñas antes de insertarlas en la base de datos.

2. **Validación de Sucursales**: Asegúrate de que el `id_branch` existe en la tabla `branches` antes de asignarlo.

3. **Roles Válidos**: Verifica que el rol existe en la tabla `roles` antes de asignarlo.

4. **Empleados del Restaurante**: Deben tener `id_branch` asignado para poder ver pedidos de su sucursal.

5. **Administradores**: Pueden tener `id_branch` NULL para acceder a todas las sucursales (cuando se implemente).

### Middleware de Autorización

El sistema implementa un middleware de autorización por roles (`checkRole`) que:
- Verifica la autenticación del usuario
- Consulta los roles asignados en la base de datos
- Valida que el usuario tenga el rol requerido
- Permite o deniega el acceso según corresponda

**Uso en rutas:**
```javascript
router.get('/orders', authMiddleware, checkRole('RESTAURANTE'), getOrders);
```

**Combinación de middlewares:**
1. `authMiddleware`: Verifica token JWT válido
2. `checkRole('ROL')`: Verifica que el usuario tenga el rol especificado

### Pruebas de Funcionalidad

Para probar que la funcionalidad de roles funciona correctamente:

1. **Configurar el schema de Prisma** (si no está hecho):
   ```bash
   # Asegurar que el schema tiene id_branch en el modelo users
   npx prisma generate
   ```

2. **Crear usuario RESTAURANTE** usando los scripts SQL anteriores

3. **Verificar configuración del usuario**:
   ```sql
   SELECT 
       u.email, u.id_branch, b.name as branch_name, r.name as role_name
   FROM users u
   LEFT JOIN branches b ON u.id_branch = b.id
   JOIN user_has_roles uhr ON u.id = uhr.id_user
   JOIN roles r ON uhr.id_rol = r.id
   WHERE u.email = 'tu_usuario@ejemplo.com';
   ```

4. **Hacer login** con las credenciales del empleado

5. **Obtener token JWT** de la respuesta

6. **Probar endpoints del restaurante** usando el token:
   ```bash
   # GET - Obtener todos los pedidos
   GET /api/restaurant/orders
   Authorization: Bearer <token>
   
   # GET - Obtener solo pedidos pagados
   GET /api/restaurant/orders?status=PAGADO
   Authorization: Bearer <token>
   
   # PUT - Actualizar estado de pedido
   PUT /api/restaurant/orders/1/status
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "status": "EN PREPARACION"
   }
   ```

7. **Verificar que solo ve pedidos de su sucursal**

8. **Verificar que los estados se actualizan correctamente**

---

## Endpoints del Repartidor

### 1. Obtener Pedidos Asignados

**GET** `/api/delivery/my-orders`

Obtiene todos los pedidos asignados al repartidor autenticado que están listos para ser entregados.

#### Autenticación Requerida
- **Token JWT**: Sí (Header: `Authorization: Bearer <token>`)
- **Rol Requerido**: `REPARTIDOR`
- **Middleware**: `authMiddleware`, `checkRole('REPARTIDOR')`

#### Parámetros de Consulta
Ninguno

#### Ejemplo de Petición

```bash
GET /api/delivery/my-orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Respuestas

##### Éxito (200 OK)
```json
{
  "success": true,
  "message": "Pedidos asignados obtenidos exitosamente",
  "data": {
    "orders": [
      {
        "id": "1",
        "id_client": "2",
        "id_delivery": "3",
        "id_address": "1",
        "id_branch": "1",
        "status": "DESPACHADO",
        "payment_method": "Efectivo",
        "subtotal": "180.00",
        "delivery_fee": "25.00",
        "total": "205.00",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T11:00:00.000Z",
        "client": {
          "id": "2",
          "name": "María",
          "lastname": "González",
          "phone": "9876543210",
          "email": "maria@ejemplo.com"
        },
        "address": {
          "id": "1",
          "address": "Calle Principal 123",
          "neighborhood": "Centro",
          "alias": "Casa",
          "lat": 20.484123,
          "lng": -99.216345
        },
        "branch": {
          "id": "1",
          "name": "Dados Pizza - Matriz Ixmiquilpan",
          "address": "Av. Insurgentes Ote. 75, Centro, 42300 Ixmiquilpan, Hgo.",
          "phone": "7711234567"
        },
        "delivery": {
          "id": "3",
          "name": "Carlos",
          "lastname": "Repartidor",
          "phone": "7719876543"
        },
        "products": [
          {
            "id": "1",
            "id_product": "1",
            "id_size": "2",
            "quantity": 1,
            "price_per_unit": "170.00",
            "product": {
              "id": "1",
              "name": "Mexicana",
              "description": "Jamon, salami, tocino, chorizo, champiñones, pimiento morron, cebolla y jalapeño"
            },
            "size": {
              "id": "2",
              "name": "Mediana"
            },
            "addons": [
              {
                "id": "1",
                "id_addon": "2",
                "price_at_purchase": "33.00",
                "addon": {
                  "id": "2",
                  "name": "Orilla de Queso Extra"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

##### Error - No Autenticado (401 Unauthorized)
```json
{
  "error": "Token de autorización requerido. Incluya el header Authorization con formato Bearer <token>"
}
```

##### Error - Sin Permisos (403 Forbidden)
```json
{
  "error": "Acceso denegado: no tienes los permisos necesarios para acceder a esta funcionalidad. Se requiere el rol: REPARTIDOR"
}
```

---

### 2. Actualizar Estado de Pedido

**PUT** `/api/delivery/orders/:id/status`

Actualiza el estado de un pedido específico asignado al repartidor autenticado.

#### Autenticación Requerida
- **Token JWT**: Sí (Header: `Authorization: Bearer <token>`)
- **Rol Requerido**: `REPARTIDOR`
- **Middleware**: `authMiddleware`, `checkRole('REPARTIDOR')`

#### Parámetros de Ruta

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | integer | Sí | ID del pedido a actualizar |

#### Parámetros de Entrada

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| status | string | Sí | Nuevo estado del pedido ('EN_CAMINO' o 'ENTREGADO') |

#### Estados Válidos para Repartidor

| Estado Actual | Estados Permitidos | Descripción |
|---------------|-------------------|-------------|
| DESPACHADO | EN CAMINO | El repartidor recoge el pedido y sale a entregar |
| EN CAMINO | ENTREGADO | El repartidor completa la entrega |

#### Ejemplo de Petición

```bash
PUT /api/delivery/orders/1/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "EN CAMINO"
}
```

#### Respuestas

##### Éxito (200 OK)
```json
{
  "success": true,
  "message": "Estado del pedido actualizado exitosamente a EN CAMINO",
  "data": {
    "order": {
      "id": "1",
      "status": "EN CAMINO",
      "payment_method": "Efectivo",
      "subtotal": "180.00",
      "delivery_fee": "25.00",
      "total": "205.00",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:15:00.000Z",
      "client": {
        "id": "2",
        "name": "María",
        "lastname": "González",
        "phone": "9876543210"
      },
      "delivery_address": {
        "id": "1",
        "address": "Calle Principal 123",
        "neighborhood": "Centro",
        "alias": "Casa"
      }
    }
  }
}
```

##### Error - Pedido No Encontrado (404 Not Found)
```json
{
  "success": false,
  "error": "Pedido no encontrado"
}
```

##### Error - Sin Permisos (403 Forbidden)
```json
{
  "success": false,
  "error": "No tienes permiso para actualizar este pedido"
}
```

##### Error - Estado Inválido (400 Bad Request)
```json
{
  "success": false,
  "error": "Estado no válido. Los estados permitidos son: EN CAMINO, ENTREGADO"
}
```

##### Error - Transición Inválida (400 Bad Request)
```json
{
  "success": false,
  "error": "Transición de estado no válida",
  "details": {
    "current_status": "PAGADO",
    "requested_status": "EN CAMINO",
    "valid_transitions": {
      "DESPACHADO": ["EN CAMINO"],
      "EN CAMINO": ["ENTREGADO"]
    }
  }
}
```

##### Error - Campo Requerido (400 Bad Request)
```json
{
  "success": false,
  "error": "El campo status es requerido"
}
```

---

### Flujo de Estados para Repartidor

El repartidor puede manejar pedidos en los siguientes estados:

1. **DESPACHADO** → **EN CAMINO**: El repartidor recoge el pedido del restaurante
2. **EN CAMINO** → **ENTREGADO**: El repartidor completa la entrega al cliente

### Seguridad Implementada

1. **Autenticación JWT**: Verifica que el usuario esté autenticado
2. **Autorización por Rol**: Solo usuarios con rol `REPARTIDOR` pueden acceder
3. **Verificación de Pertenencia**: Solo puede actualizar pedidos asignados a él
4. **Validación de Estados**: Solo permite transiciones válidas del flujo de negocio
5. **Validación de Datos**: Verifica que los campos requeridos estén presentes

### Pruebas de Funcionalidad

Para probar la funcionalidad del repartidor:

1. **Crear usuario REPARTIDOR**:
   ```sql
   -- Insertar usuario repartidor
   INSERT INTO users (email, name, lastname, phone, password, created_at, updated_at) 
   VALUES ('repartidor@dados.com', 'Carlos', 'Repartidor', '7719876543', '$2b$10$ejemplo', NOW(), NOW());
   
   -- Asignar rol REPARTIDOR
   INSERT INTO user_has_roles (id_user, id_rol, created_at, updated_at)
   VALUES (
     (SELECT id FROM users WHERE email = 'repartidor@dados.com'),
     (SELECT id FROM roles WHERE name = 'REPARTIDOR'),
     NOW(), NOW()
   );
   ```

2. **Asignar pedido al repartidor**:
   ```sql
   -- Actualizar un pedido para asignarlo al repartidor
   UPDATE orders 
   SET id_delivery = (SELECT id FROM users WHERE email = 'repartidor@dados.com'),
       status = 'DESPACHADO'
   WHERE id = 1;
   ```

3. **Hacer login** con las credenciales del repartidor

4. **Obtener token JWT** de la respuesta

5. **Probar endpoints del repartidor**:
   ```bash
   # GET - Obtener pedidos asignados
   GET /api/delivery/my-orders
   Authorization: Bearer <token>
   
   # PUT - Marcar como en camino
   PUT /api/delivery/orders/1/status
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "status": "EN CAMINO"
   }
   
   # PUT - Marcar como entregado
   PUT /api/delivery/orders/1/status
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "status": "ENTREGADO"
   }
   ```

6. **Verificar que solo ve pedidos asignados a él**

7. **Verificar que las transiciones de estado funcionan correctamente**

---

## 🔧 Troubleshooting - Compatibilidad MySQL

### Problemas Comunes y Soluciones

#### Error: "Native type DoublePrecision is not supported for mysql connector"

**Causa**: El schema de Prisma contiene anotaciones específicas de PostgreSQL que no son compatibles con MySQL.

**Solución**: 
1. Verificar que el archivo `prisma/schema.prisma` no contenga anotaciones `@db.DoublePrecision`
2. Los campos de coordenadas deben estar definidos como `Float` sin anotaciones específicas:

```prisma
// ✅ Correcto para MySQL
model address {
  lat          Float
  lng          Float
}

// ❌ Incorrecto (específico de PostgreSQL)
model address {
  lat          Float    @db.DoublePrecision
  lng          Float    @db.DoublePrecision
}
```

#### Error: "Unknown field id_branch"

**Causa**: El cliente de Prisma no está actualizado después de modificar el schema.

**Solución**:
```bash
# Regenerar el cliente de Prisma
npx prisma generate

# Reiniciar el servidor
npm run dev
```

#### Error de Conexión a MySQL

**Verificar configuración**:
1. **URL de conexión correcta**:
   ```env
   DATABASE_URL="mysql://usuario:password@localhost:3306/nombre_bd"
   ```

2. **Credenciales válidas**: Usuario y contraseña correctos

3. **Base de datos existente**: La base de datos debe existir antes de ejecutar migraciones

4. **Puerto correcto**: MySQL por defecto usa el puerto 3306

#### Error: "Table doesn't exist"

**Solución**:
```bash
# Aplicar migraciones
npx prisma db push

# O crear migración
npx prisma migrate dev --name init
```

#### Verificar Estado del Schema

**Comando para verificar**:
```bash
# Verificar que el schema es válido
npx prisma validate

# Ver estado de la base de datos
npx prisma db pull
```

#### Migración desde PostgreSQL a MySQL

Si estás migrando desde PostgreSQL:

1. **Actualizar el datasource**:
   ```prisma
   datasource db {
     provider = "mysql"  // Cambiar de "postgresql" a "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Eliminar anotaciones específicas de PostgreSQL**:
   - `@db.DoublePrecision` → `Float`
   - `@db.Uuid` → `String @id @default(uuid())`
   - `@db.Timestamp(0)` → `DateTime @db.Timestamp(0)`

3. **Regenerar y aplicar**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Comandos de Diagnóstico

```bash
# Verificar conexión a la base de datos
npx prisma db pull

# Ver el estado actual del schema
npx prisma format

# Generar cliente con información detallada
npx prisma generate --schema=./prisma/schema.prisma

# Verificar que las migraciones están aplicadas
npx prisma migrate status
```

### Logs Útiles

Para debugging, revisar:
- Logs del servidor Node.js
- Logs de MySQL (`/var/log/mysql/error.log` en Linux)
- Output de `npx prisma generate`
- Variables de entorno (verificar que `DATABASE_URL` esté configurada)
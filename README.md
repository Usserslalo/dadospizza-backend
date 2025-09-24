# Dados Pizza Backend API

Backend completo para el sistema de gestión de pedidos de Dados Pizza, desarrollado con Node.js, Express y Prisma ORM.

## 🚀 Características Principales

- **API RESTful** completa con autenticación JWT
- **Sistema de roles** (Cliente, Restaurante, Repartidor)
- **Gestión de pedidos** con cálculo automático de precios
- **Notificaciones en tiempo real** con Socket.IO
- **Sistema de sucursales** y asignación automática de repartidores
- **Base de datos MySQL** optimizada con Prisma ORM
- **Arquitectura escalable** y bien documentada

## 📋 Requisitos del Sistema

- **Node.js** 16.x o superior
- **MySQL** 8.0 o superior
- **npm** o **yarn**

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd dadospizza-backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DATABASE_URL="mysql://usuario:password@localhost:3306/dadospizza"

# JWT
JWT_SECRET="tu_clave_secreta_jwt_muy_segura"

# Puerto del Servidor
PORT=3000
```

### 4. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# O crear migración
npx prisma migrate dev --name init
```

### 5. Ejecutar el Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación de la API

### Documentación Completa
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación completa de todos los endpoints
- **[SOCKET_IO_DOCUMENTATION.md](./SOCKET_IO_DOCUMENTATION.md)** - Sistema de notificaciones en tiempo real

### Endpoints Principales

#### Autenticación
- `POST /api/users/register` - Registro de usuarios
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users/profile` - Perfil del usuario

#### Catálogo de Productos
- `GET /api/products` - Todos los productos
- `GET /api/products/:id` - Detalle de producto
- `GET /api/categories` - Categorías disponibles
- `GET /api/sizes` - Tamaños disponibles

#### Gestión de Pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders/my-history` - Historial de pedidos

#### Panel de Restaurante
- `GET /api/restaurant/orders` - Pedidos por sucursal
- `PUT /api/restaurant/orders/:id/status` - Actualizar estado

#### Panel de Repartidor
- `GET /api/delivery/my-orders` - Pedidos asignados
- `PUT /api/delivery/orders/:id/status` - Actualizar estado de entrega

## 🏗️ Estructura del Proyecto

```
dadospizza-backend/
├── src/
│   ├── config/
│   │   ├── bd.txt              # Script de base de datos
│   │   └── socket.js           # Configuración Socket.IO
│   ├── controllers/            # Controladores de la API
│   ├── middleware/             # Middlewares de autenticación
│   ├── routers/                # Rutas de la API
│   ├── services/               # Servicios de negocio
│   └── server.js               # Servidor principal
├── prisma/
│   ├── migrations/             # Migraciones de BD
│   └── schema.prisma           # Schema de Prisma
├── tests/                      # Scripts de prueba
├── API_DOCUMENTATION.md        # Documentación completa
├── SOCKET_IO_DOCUMENTATION.md  # Documentación Socket.IO
└── README.md                   # Este archivo
```

## 🔧 Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL 8.0+
- **ORM**: Prisma
- **Autenticación**: JWT (jsonwebtoken)
- **Encriptación**: bcryptjs
- **Tiempo Real**: Socket.IO
- **Validación**: Middlewares personalizados

## 🔐 Sistema de Seguridad

- **Autenticación JWT** con expiración de 24 horas
- **Encriptación de contraseñas** con bcryptjs
- **Middleware de autorización** por roles
- **Validación robusta** de datos de entrada
- **Transacciones atómicas** para operaciones críticas

## 📱 Integración con Flutter

El backend está diseñado para integrarse perfectamente con aplicaciones Flutter:

- **API RESTful** estándar
- **Notificaciones en tiempo real** con Socket.IO
- **Respuestas JSON** optimizadas para móviles
- **Manejo de BigInt** para compatibilidad con Flutter

## 🧪 Testing

```bash
# Ejecutar scripts de prueba
cd tests/
node test-connection.js
node test-login.js
```

## 🚀 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
DATABASE_URL="mysql://usuario:password@servidor:3306/dadospizza"
JWT_SECRET="clave_secreta_muy_segura_en_produccion"
PORT=3000
```

### Comandos de Despliegue

```bash
# Instalar dependencias de producción
npm ci --only=production

# Iniciar servidor
npm start
```

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto es propiedad de Dados Pizza. Todos los derechos reservados.

---

**Desarrollado con ❤️ para Dados Pizza**

# Sistema de Microservicios E-commerce con Persistencia

Sistema asíncrono de gestión de pedidos implementado con Node.js, TypeScript, RabbitMQ y MySQL.

## 🏗️ Arquitectura Reestructurada

El sistema consta de 3 microservicios especializados según los requerimientos:

### 🎯 **order-service** (Puerto 3000) - **COORDINADOR**
- **Función**: Recibe órdenes y coordina el proceso completo
- **NO almacena**: Solo mantiene referencias temporales durante la coordinación
- **Flujo**: Valida → Coordina → Responde al cliente

### 📊 **inventory-service** (Puerto 3001) - **VALIDADOR**  
- **Función**: Valida existencias y reserva inventario
- **Almacena**: Inventario en memoria (productos y cantidades)
- **Flujo**: Recibe solicitud → Valida stock → Reserva → Responde

### 💾 **delivery-service** (Puerto 3002) - **PERSISTENCIA**
- **Función**: Crea y almacena pedidos, maneja entregas
- **Almacena**: Todas las órdenes en base de datos MySQL
- **Flujo**: Recibe orden validada → Guarda en DB → Procesa entrega


## 📊 Estados del Pedido

| Estado | Descripción | Servicio Responsable |
|--------|-------------|---------------------|
| `created` | Pedido creado y guardado en DB | Delivery Service |
| `processing` | En proceso de preparación | Delivery Service |
| `shipped` | Enviado al cliente | Delivery Service |
| `delivered` | Entregado exitosamente | Delivery Service |
| `inventory_failed` | Falló validación de inventario | Order Service |
| `cancelled` | Cancelado durante proceso | Delivery Service |

## 🚀 Instalación y Configuración

### 1. Requisitos Previos
- Node.js >= 16
- Docker y Docker Compose
- MySQL 8.0
- npm o yarn

### 2. Configuración de Base de Datos y RabbitMQ
```bash
# Iniciar servicios de infraestructura
docker-compose up rabbitmq mysql -d

# Verificar que estén funcionando
docker ps
```

### 3. Configurar Variables de Entorno
```bash
# Crear .env en cada servicio
cp .env.example .env

# Configuración básica (.env):
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=ecommerce_user
DB_PASS=ecommerce_pass
RABBITMQ_URL=amqp://localhost
```

### 4. Instalar Dependencias
```bash
# En cada servicio
cd order-service && npm install
cd ../inventory-service && npm install  
cd ../delivery-service && npm install
```

### 5. Inicializar Base de Datos
La base de datos se inicializa automáticamente al iniciar el docker file:
- Tablas `orders` y `order_items`
- Datos de ejemplo
- Índices optimizados

### 6. Ejecutar Servicios

#### Opción A: Desarrollo (Recomendado)
```bash
# Terminal 1 - Order service
cd order-service
npm run dev

# Terminal 2 - Inventory Service  
cd inventory-service
npm run dev

# Terminal 3 - Delivery Service (con DB)
cd delivery-service
npm run dev
```

#### Opción B: Con Docker
```bash
docker-compose up --build
```



### Pruebas Manuales



#### 1. Consultar Datos Iniciales
```bash
# Inventario disponible
curl http://localhost:3001/inventory

# Órdenes existentes
curl http://localhost:3002/orders

# Estadísticas de DB
curl "http://localhost:3002/orders/stats/summary"
```

#### 2. Crear Pedido Exitoso
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-success-001",
    "customerId": "customer-001",
    "items": [
      {"productId": "2", "quantity": 2},
      {"productId": "3", "quantity": 1}
    ],
    "shippingAddress": "123 Test Street, Test City, TC 12345"
  }'
```

#### 3. Crear Pedido que Falle
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-fail-001", 
    "customerId": "customer-002",
    "items": [
      {"productId": "1", "quantity": 1000}
    ],
    "shippingAddress": "456 Fail Avenue, Error City, EC 67890"
  }'
```

#### 4. Consultar Estado de Pedido
```bash
# A través del coordinador (delega a delivery)
curl http://localhost:3000/orders/test-success-001/status

# Directamente desde delivery service
curl http://localhost:3002/orders/test-success-001
```

#### 5. Agregar Stock
```bash
curl -X POST http://localhost:3001/inventory/add-stock \
  -H "Content-Type: application/json" \
  -d '{"productId": "1", "quantity": 50}'
```

## 📊 Inventario Inicial

| ID | Producto | Cantidad | Precio |
|----|----------|----------|---------|
| 1 | Laptop Gaming | 10 | $1,299.99 |
| 2 | Wireless Mouse | 50 | $29.99 |
| 3 | Mechanical Keyboard | 25 | $149.99 |
| 4 | Monitor 4K | 8 | $399.99 |
| 5 | Headphones | 15 | $199.99 |

## 🔗 Endpoints API

### Order Service (Coordinador) - Puerto 3000
- `POST /orders` - Crear y coordinar nuevo pedido
- `GET /orders/:orderId/status` - Consultar estado (delega a delivery)
- `GET /coordinator/stats` - Estadísticas del coordinador

### Inventory Service - Puerto 3001
- `GET /inventory` - Consultar inventario disponible
- `POST /inventory/add-stock` - Agregar stock a productos

### Delivery Service (Persistencia) - Puerto 3002
- `GET /orders` - Listar todas las órdenes (desde DB)
- `GET /orders/:orderId` - Obtener orden específica (desde DB)
- `GET /orders/stats/summary` - Estadísticas de órdenes
- `PUT /orders/:orderId/status` - Actualizar estado manualmente

## 💾 Esquema de Base de Datos

### Tabla `orders`
```sql
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  customerId VARCHAR(255) NOT NULL,
  status ENUM('created', 'processing', 'shipped', 'delivered', 'cancelled'),
  totalAmount DECIMAL(10, 2) NOT NULL,
  shippingAddress TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla `order_items`
```sql
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(255) NOT NULL,
  productId VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
```

## 🔍 Monitoreo y Logs

### RabbitMQ Management
- URL: http://localhost:15672
- Usuario: `guest` / Contraseña: `guest`
- Colas a monitorear:
  - `inventory_queue` - Validaciones de inventario
  - `inventory_response_queue` - Respuestas de inventario
  - `delivery_create_queue` - Creación de pedidos
  - `delivery_response_queue` - Confirmaciones de creación

### Logs del Sistema
Cada servicio muestra logs detallados:
- **Order Service**: Coordinación y timeouts
- **Inventory Service**: Validaciones y reservas
- **Delivery Service**: Creación en DB y procesamiento



### Servicios no se conectan
```bash
# Verificar RabbitMQ
docker logs ecommerce-rabbitmq

# Verificar MySQL
docker logs ecommerce-mysql

# Reiniciar servicios
docker-compose restart
```

### Pedidos no se crean
1. Verificar logs de todos los servicios
2. Comprobar conexión a RabbitMQ
3. Verificar estado de base de datos
4. Revisar inventario disponible

### Base de datos no inicializa
```bash
# Recrear base de datos
docker-compose down -v
docker-compose up mysql -d
```

/*
CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

-- Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  customerId VARCHAR(255) NOT NULL,
  status ENUM('created', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'created',
  totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shippingAddress TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer (customerId),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);

-- Crear tabla de items de órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(255) NOT NULL,
  productId VARCHAR(255) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unitPrice DECIMAL(10, 2) NOT NULL CHECK (unitPrice >= 0),
  totalPrice DECIMAL(10, 2) NOT NULL CHECK (totalPrice >= 0),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (orderId),
  INDEX idx_product (productId)
);
*/
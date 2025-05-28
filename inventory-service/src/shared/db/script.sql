CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

-- Datos iniciales de productos
INSERT INTO products (id, name, description, price, category, created_at, updated_at) VALUES
('prod-1', 'Laptop Gaming', 'High performance gaming laptop', 1299.99, 'Electronics', NOW(), NOW()),
('prod-2', 'Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', NOW(), NOW()),
('prod-3', 'Mechanical Keyboard', 'RGB mechanical keyboard', 149.99, 'Electronics', NOW(), NOW()),
('prod-4', 'Monitor 4K', '27 inch 4K gaming monitor', 399.99, 'Electronics', NOW(), NOW()),
('prod-5', 'Headphones', 'Noise cancelling headphones', 199.99, 'Electronics', NOW(), NOW());

-- Datos iniciales de inventario
INSERT INTO inventory (product_id, quantity, reserved_quantity, created_at, updated_at) VALUES
('prod-1', 50, 0, NOW(), NOW()),
('prod-2', 100, 0, NOW(), NOW()),
('prod-3', 75, 0, NOW(), NOW()),
('prod-4', 25, 0, NOW(), NOW()),
('prod-5', 80, 0, NOW(), NOW());
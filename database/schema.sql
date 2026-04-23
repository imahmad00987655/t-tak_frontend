-- TikTak Water full schema (customers + deliveries)
-- MySQL 8+ / MariaDB 10.3+
-- Run in phpMyAdmin or: mysql -u root -p < database/schema.sql
--
-- NOTE:
-- 1) If you previously had MySQL #1813 on this DB, stop MySQL and clean
--    stale folder: C:\xampp3\mysql\data\tiktakwater, then import again.
-- 2) This script is idempotent for local dev: it recreates tables.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS tiktakwater
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tiktakwater;

DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS route_workers;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS daily_closings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS delivery_items;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS customers;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id VARCHAR(32) NULL COMMENT 'Public code e.g. WD-1001 (set after insert)',
  qr_token CHAR(36) NOT NULL COMMENT 'Opaque token for public QR URL',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  alt_phone VARCHAR(32) NULL,
  address TEXT NOT NULL,
  area VARCHAR(128) NOT NULL,
  zone VARCHAR(64) NOT NULL DEFAULT '',
  route VARCHAR(64) NOT NULL DEFAULT '',
  customer_type ENUM('residential', 'commercial', 'industrial') NOT NULL DEFAULT 'residential',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  joining_date DATE NOT NULL,
  wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  assigned_worker_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_customer_id (customer_id),
  UNIQUE KEY uq_customers_qr_token (qr_token),
  KEY idx_customers_phone (phone),
  KEY idx_customers_area (area),
  KEY idx_customers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
CREATE TABLE employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(255) NULL,
  role ENUM('admin', 'staff', 'field_worker') NOT NULL DEFAULT 'field_worker',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  assigned_area VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employees_role (role),
  KEY idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- users / auth
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'field_worker', 'client') NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  employee_id INT UNSIGNED NULL,
  customer_id INT UNSIGNED NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_employee_id (employee_id),
  UNIQUE KEY uq_users_customer_id (customer_id),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL,
  CONSTRAINT fk_users_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- app settings / notifications / role permissions
-- ---------------------------------------------------------------------------
CREATE TABLE app_settings (
  setting_key VARCHAR(64) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_settings (
  setting_key VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role ENUM('admin', 'staff', 'field_worker', 'client') NOT NULL,
  permission_key VARCHAR(128) NOT NULL,
  PRIMARY KEY (role, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(512) NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'unit',
  default_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  category VARCHAR(128) NOT NULL DEFAULT 'General',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  stock_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- wallet_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE wallet_transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(512) NOT NULL,
  reference_id VARCHAR(64) NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wt_customer (customer_id),
  CONSTRAINT fk_wt_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NULL,
  walk_in_name VARCHAR(255) NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method ENUM('cash', 'bank_transfer', 'online', 'other') NOT NULL,
  reference_id VARCHAR(64) NULL,
  notes VARCHAR(512) NULL,
  applied_to_wallet TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_customer (customer_id),
  KEY idx_payments_created_at (created_at),
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
CREATE TABLE expenses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(64) NOT NULL,
  description VARCHAR(512) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expenses_date (expense_date),
  KEY idx_expenses_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- daily closings
-- ---------------------------------------------------------------------------
CREATE TABLE daily_closings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  closing_date DATE NOT NULL,
  total_deliveries INT NOT NULL DEFAULT 0,
  completed_deliveries INT NOT NULL DEFAULT 0,
  failed_deliveries INT NOT NULL DEFAULT 0,
  pending_deliveries INT NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  expenses DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  closed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_daily_closings_date (closing_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE deliveries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  delivery_code VARCHAR(32) NULL,
  customer_id INT UNSIGNED NOT NULL,
  worker_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'assigned', 'in_progress', 'delivered', 'partially_delivered', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('paid', 'partial', 'unpaid') NOT NULL DEFAULT 'unpaid',
  wallet_deduction DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  amount_due DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  delivery_date DATE NOT NULL,
  delivery_time TIME NULL,
  period_start_date DATE NULL,
  period_end_date DATE NULL,
  advance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_deliveries_code (delivery_code),
  KEY idx_deliveries_customer (customer_id),
  KEY idx_deliveries_worker (worker_id),
  KEY idx_deliveries_date (delivery_date),
  CONSTRAINT fk_deliveries_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_deliveries_worker FOREIGN KEY (worker_id) REFERENCES employees (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- delivery_items
-- ---------------------------------------------------------------------------
CREATE TABLE delivery_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  delivery_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_delivery_items_delivery (delivery_id),
  KEY idx_delivery_items_product (product_id),
  CONSTRAINT fk_delivery_items_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries (id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- routes / areas
-- ---------------------------------------------------------------------------
CREATE TABLE routes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  area VARCHAR(128) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_routes_name (name),
  KEY idx_routes_area (area),
  KEY idx_routes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE route_workers (
  route_id INT UNSIGNED NOT NULL,
  worker_id INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id, worker_id),
  CONSTRAINT fk_route_workers_route FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE,
  CONSTRAINT fk_route_workers_worker FOREIGN KEY (worker_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'unit',
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  last_restocked DATE NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_items_status (status),
  KEY idx_inventory_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_item_id INT UNSIGNED NOT NULL,
  type ENUM('stock_in', 'stock_out', 'damage', 'loss') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  notes VARCHAR(512) NULL,
  balance_after INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_txn_item (inventory_item_id),
  CONSTRAINT fk_inventory_txn_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------
INSERT INTO employees (id, name, phone, email, role, status, assigned_area) VALUES
  (1, 'Imran Khan', '0301-1111111', 'imran@waterdist.pk', 'field_worker', 'active', 'Gulberg, Model Town'),
  (2, 'Tariq Mehmood', '0302-2222222', 'tariq@waterdist.pk', 'field_worker', 'active', 'DHA, Old City'),
  (3, 'Naveed Akhtar', '0303-3333333', 'naveed@waterdist.pk', 'field_worker', 'active', 'Wapda Town, Kot Lakhpat');

INSERT INTO customers (
  id, customer_id, qr_token, name, phone, alt_phone, address, area, zone, route,
  customer_type, status, joining_date, wallet_balance, notes, assigned_worker_id
) VALUES
(
  1, 'WD-1001', UUID(), 'Ahmad Hassan', '0301-1234567', '0321-7654321',
  'House 12, Block A, Gulberg III', 'Gulberg', 'Central', 'Route A1',
  'residential', 'active', '2024-01-15', 2500.00, 'Prefers morning delivery', 1
),
(
  2, 'WD-1002', UUID(), 'Fatima Enterprises', '0300-9876543', NULL,
  '45-B, Main Boulevard, DHA Phase 5', 'DHA', 'South', 'Route B2',
  'commercial', 'active', '2024-02-20', 8500.00, NULL, 2
),
(
  3, 'WD-1003', UUID(), 'Ali Raza', '0333-4567890', NULL,
  'Flat 6, Floor 3, Johar Town', 'Johar Town', 'East', 'Route C1',
  'residential', 'active', '2024-03-10', 500.00, NULL, 1
);

INSERT INTO users (name, email, phone, password_hash, role, status, employee_id, customer_id) VALUES
  ('Hassan Ali', 'admin@waterdist.pk', '0305-5555555', 'admin123', 'admin', 'active', NULL, NULL),
  ('Saira Batool', 'staff@waterdist.pk', '0304-4444444', 'staff123', 'staff', 'active', NULL, NULL),
  ('Imran Khan', 'worker@waterdist.pk', '0301-1111111', 'worker123', 'field_worker', 'active', 1, NULL),
  ('Ahmad Hassan', 'client@waterdist.pk', '0301-1234567', 'client123', 'client', 'active', NULL, 1);

INSERT INTO products (id, name, description, unit, default_price, category, status, stock_quantity) VALUES
  (1, '19L Water Can', 'Standard 19 liter filtered water can', 'can', 80.00, 'Water', 'active', 450),
  (2, '10L Water Bottle', '10 liter filtered water bottle', 'bottle', 50.00, 'Water', 'active', 300),
  (3, '1.5L Mineral Water', '1.5 liter mineral water bottle', 'bottle', 30.00, 'Water', 'active', 1200),
  (4, '500ml Water Pack (12)', 'Pack of 12 x 500ml bottles', 'pack', 180.00, 'Water', 'active', 200);

INSERT INTO wallet_transactions (customer_id, type, amount, description, balance_after)
SELECT id, 'credit', wallet_balance, 'Opening balance / seed', wallet_balance FROM customers;

INSERT INTO payments (customer_id, amount, method, reference_id, notes, applied_to_wallet, created_at) VALUES
  (1, 5000.00, 'cash', NULL, 'Opening cash deposit', 1, '2026-04-07 14:00:00'),
  (2, 10000.00, 'bank_transfer', 'TRX-8834', 'Wallet recharge via bank', 1, '2026-04-06 10:00:00');

INSERT INTO expenses (category, description, amount, expense_date, created_at) VALUES
  ('Fuel', 'Delivery truck fuel - Route A & B', 3500.00, '2026-04-08', '2026-04-08 09:00:00'),
  ('Maintenance', 'Filter replacement - Plant Unit 2', 12000.00, '2026-04-07', '2026-04-07 11:00:00'),
  ('Utilities', 'Electricity bill - April', 45000.00, '2026-04-05', '2026-04-05 10:00:00'),
  ('Packaging', 'Bottle caps and shrink wrap order', 8500.00, '2026-04-03', '2026-04-03 15:30:00');

INSERT INTO deliveries (
  id, delivery_code, customer_id, worker_id, status, payment_status,
  wallet_deduction, amount_due, total_amount, delivery_date, delivery_time, notes
) VALUES
  (1, 'D-000001', 1, 1, 'delivered', 'paid', 0.00, 0.00, 240.00, '2026-04-08', '09:15:00', NULL),
  (2, 'D-000002', 2, 2, 'assigned', 'unpaid', 0.00, 750.00, 750.00, '2026-04-09', NULL, 'Deliver before 12 PM');

INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price, total) VALUES
  (1, 1, 3, 80.00, 240.00),
  (2, 1, 5, 80.00, 400.00),
  (2, 2, 7, 50.00, 350.00);

INSERT INTO routes (id, name, area, status) VALUES
  (1, 'Route A1', 'Gulberg', 'active'),
  (2, 'Route A2', 'Model Town', 'active'),
  (3, 'Route B1', 'Wapda Town', 'active'),
  (4, 'Route B2', 'DHA', 'active'),
  (5, 'Route C1', 'Johar Town', 'active');

INSERT INTO route_workers (route_id, worker_id) VALUES
  (1, 1),
  (2, 1),
  (3, 3),
  (4, 2),
  (5, 1);

INSERT INTO inventory_items (id, name, category, unit, current_stock, min_stock_level, unit_cost, last_restocked, status) VALUES
  (1, '19L Water Cans', 'Containers', 'pieces', 450, 100, 15.00, '2026-04-06', 'active'),
  (2, '10L Water Bottles', 'Containers', 'pieces', 300, 80, 10.00, '2026-04-05', 'active'),
  (3, '1.5L Bottles', 'Bottles', 'pieces', 1200, 200, 5.00, '2026-04-07', 'active'),
  (4, 'Bottle Caps', 'Packaging', 'pieces', 5000, 1000, 0.50, '2026-04-01', 'active'),
  (5, 'Filter Cartridges', 'Consumables', 'pieces', 12, 10, 1500.00, '2026-03-15', 'active');

INSERT INTO inventory_transactions (inventory_item_id, type, quantity, notes, balance_after) VALUES
  (1, 'stock_in', 200, 'New batch from supplier', 450),
  (1, 'stock_out', 40, 'Daily deliveries', 410),
  (5, 'stock_out', 2, 'Replaced in Plant Unit 2', 10);

INSERT INTO audit_logs (actor, action, details, created_at) VALUES
  ('Imran Khan', 'Delivery completed', 'D-000001 for Ahmad Hassan', '2026-04-08 10:30:00'),
  ('System', 'Wallet deducted', 'Rs 240 from WD-1001', '2026-04-08 10:31:00'),
  ('Tariq Mehmood', 'Delivery completed', 'D-000002 for Fatima Enterprises', '2026-04-08 11:00:00'),
  ('System', 'Wallet deducted', 'Rs 1350 from WD-1002', '2026-04-08 11:01:00'),
  ('Saira Batool', 'Payment recorded', 'Rs 4000 cash from Bilal Ahmed', '2026-04-08 08:00:00');

INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('business_name', 'Water Distribution Co.'),
  ('business_phone', '+92-42-12345678'),
  ('business_email', 'info@waterdist.pk'),
  ('business_city', 'Lahore'),
  ('business_address', 'Plant Unit 1, Industrial Area, Lahore'),
  ('allow_credit', 'true'),
  ('auto_invoice', 'true'),
  ('client_report_mode', 'daily'),
  ('default_payment_method', 'cash'),
  ('promo_buy_x_get_y_enabled', 'false'),
  ('promo_buy_x_qty', '0'),
  ('promo_buy_y_qty', '0'),
  ('promo_spend_x_get_y_enabled', 'false'),
  ('promo_spend_amount', '0'),
  ('promo_spend_free_qty', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO notification_settings (setting_key, enabled) VALUES
  ('low_stock_alert', 1),
  ('email_notify', 0),
  ('failed_delivery_alert', 1),
  ('payment_received_alert', 1)
ON DUPLICATE KEY UPDATE enabled = VALUES(enabled);

INSERT INTO role_permissions (role, permission_key) VALUES
  ('admin', 'all'),
  ('staff', 'operations'),
  ('staff', 'inventory'),
  ('staff', 'daily_closing'),
  ('field_worker', 'qr_scan'),
  ('field_worker', 'deliveries'),
  ('field_worker', 'route_tasks'),
  ('client', 'view_deliveries'),
  ('client', 'view_balance'),
  ('client', 'view_bills');

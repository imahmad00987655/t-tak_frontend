-- Hostinger safe repair script (NON-DESTRUCTIVE)
-- 1) Select your existing database first in phpMyAdmin (example: u221106554_tiktakwater)
-- 2) Then run this script.
-- 3) This script does NOT drop any table.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Core operational tables often deleted by mistake
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS routes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  area VARCHAR(128) NOT NULL,
  zone VARCHAR(64) NOT NULL DEFAULT '',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_routes_name (name),
  KEY idx_routes_area (area),
  KEY idx_routes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
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

CREATE TABLE IF NOT EXISTS deliveries (
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

CREATE TABLE IF NOT EXISTS delivery_items (
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

CREATE TABLE IF NOT EXISTS route_workers (
  route_id INT UNSIGNED NOT NULL,
  worker_id INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id, worker_id),
  CONSTRAINT fk_route_workers_route FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE,
  CONSTRAINT fk_route_workers_worker FOREIGN KEY (worker_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (
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

CREATE TABLE IF NOT EXISTS expenses (
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

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NULL,
  walk_in_name VARCHAR(255) NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method ENUM('cash', 'bank_transfer', 'online', 'card', 'other') NOT NULL,
  reference_id VARCHAR(64) NULL,
  notes VARCHAR(512) NULL,
  applied_to_wallet TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_customer (customer_id),
  KEY idx_payments_created_at (created_at),
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_closings (
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

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_settings (
  setting_key VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role ENUM('admin', 'staff', 'field_worker', 'client') NOT NULL,
  permission_key VARCHAR(128) NOT NULL,
  PRIMARY KEY (role, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Compatibility alters (safe for upgraded code)
-- ---------------------------------------------------------------------------

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS zone VARCHAR(64) NOT NULL DEFAULT '' AFTER area;

ALTER TABLE payments
  MODIFY method ENUM('cash', 'bank_transfer', 'online', 'card', 'other') NOT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS inventory_item_id INT UNSIGNED NULL AFTER default_price;

SET @has_inventory_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_inventory_item'
);
SET @sql := IF(
  @has_inventory_idx = 0,
  'ALTER TABLE products ADD INDEX idx_products_inventory_item (inventory_item_id)',
  'SELECT "idx_products_inventory_item already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_products_inventory := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'fk_products_inventory_item'
);
SET @sql := IF(
  @has_fk_products_inventory = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_inventory_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id) ON DELETE SET NULL',
  'SELECT "fk_products_inventory_item already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Keep these essential setting rows present
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('allow_credit', 'true'),
  ('promo_buy_x_get_y_enabled', 'false'),
  ('promo_buy_x_qty', '0'),
  ('promo_buy_y_qty', '0'),
  ('promo_spend_x_get_y_enabled', 'false'),
  ('promo_spend_amount', '0'),
  ('promo_spend_free_qty', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

SET FOREIGN_KEY_CHECKS = 1;

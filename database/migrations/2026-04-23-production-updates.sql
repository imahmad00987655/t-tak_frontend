USE tiktakwater;

-- Payments: enable walk-in transactions (no registered customer required)
SET @need_customer_nullable := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'customer_id'
    AND IS_NULLABLE = 'NO'
);
SET @sql := IF(
  @need_customer_nullable > 0,
  'ALTER TABLE payments MODIFY customer_id INT UNSIGNED NULL',
  'SELECT "customer_id already nullable"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_walk_in_name := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'walk_in_name'
);
SET @sql := IF(
  @has_walk_in_name = 0,
  'ALTER TABLE payments ADD COLUMN walk_in_name VARCHAR(255) NULL AFTER customer_id',
  'SELECT "walk_in_name already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Delivery planning fields for advance-period tracking
SET @has_period_start := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliveries' AND COLUMN_NAME = 'period_start_date'
);
SET @sql := IF(
  @has_period_start = 0,
  'ALTER TABLE deliveries ADD COLUMN period_start_date DATE NULL AFTER delivery_time',
  'SELECT "period_start_date already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_period_end := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliveries' AND COLUMN_NAME = 'period_end_date'
);
SET @sql := IF(
  @has_period_end = 0,
  'ALTER TABLE deliveries ADD COLUMN period_end_date DATE NULL AFTER period_start_date',
  'SELECT "period_end_date already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_advance := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliveries' AND COLUMN_NAME = 'advance_amount'
);
SET @sql := IF(
  @has_advance = 0,
  'ALTER TABLE deliveries ADD COLUMN advance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER period_end_date',
  'SELECT "advance_amount already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Roles cleanup: remove super_admin and merge into admin
UPDATE users SET role = 'admin' WHERE role = 'super_admin';
DELETE FROM role_permissions WHERE role = 'super_admin';
INSERT IGNORE INTO role_permissions (role, permission_key) VALUES ('admin', 'all');

-- Promotions/package settings keys
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('promo_buy_x_get_y_enabled', 'false'),
  ('promo_buy_x_qty', '0'),
  ('promo_buy_y_qty', '0'),
  ('promo_spend_x_get_y_enabled', 'false'),
  ('promo_spend_amount', '0'),
  ('promo_spend_free_qty', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Product -> inventory linkage for automatic stock deductions on delivery/sales
SET @has_inventory_item_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'inventory_item_id'
);
SET @sql := IF(
  @has_inventory_item_id = 0,
  'ALTER TABLE products ADD COLUMN inventory_item_id INT UNSIGNED NULL AFTER default_price',
  'SELECT "products.inventory_item_id already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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

UPDATE products p
LEFT JOIN inventory_items ii ON ii.id = p.id
SET p.inventory_item_id = ii.id
WHERE p.inventory_item_id IS NULL;

-- payment method extension: add card support
ALTER TABLE payments
  MODIFY method ENUM('cash', 'bank_transfer', 'online', 'card', 'other') NOT NULL;

-- dynamic expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expense_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO expense_categories (name, status)
SELECT DISTINCT category, 'active'
FROM expenses
WHERE category IS NOT NULL AND TRIM(category) <> '';

-- returns and damages
CREATE TABLE IF NOT EXISTS returns_damages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entry_type ENUM('return', 'damage') NOT NULL,
  customer_id INT UNSIGNED NULL,
  walk_in_name VARCHAR(255) NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  adjustment_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reason VARCHAR(255) NULL,
  notes VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_returns_damages_created (created_at),
  KEY idx_returns_damages_customer (customer_id),
  KEY idx_returns_damages_product (product_id),
  CONSTRAINT fk_returns_damages_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_returns_damages_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

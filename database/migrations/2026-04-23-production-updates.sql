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

-- Hostinger final repair + minimum seed (non-destructive)
-- Select DB first: u221106554_tiktakwater

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Missing critical tables
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS wallet_transactions (
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

-- Existing helper tables (safe if already present)
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

-- Ensure upgraded enum exists
ALTER TABLE payments
  MODIFY method ENUM('cash', 'bank_transfer', 'online', 'card', 'other') NOT NULL;

-- Seed settings
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('allow_credit', 'true'),
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

INSERT IGNORE INTO role_permissions (role, permission_key) VALUES
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

-- Wallet opening rows for customers that do not have any wallet txn yet
INSERT INTO wallet_transactions (customer_id, type, amount, description, reference_id, balance_after)
SELECT c.id, 'credit', c.wallet_balance, 'Opening balance restore', NULL, c.wallet_balance
FROM customers c
LEFT JOIN wallet_transactions wt ON wt.customer_id = c.id
WHERE wt.id IS NULL AND c.wallet_balance > 0;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Verification queries (run separately after script)
-- ------------------------------------------------------------
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = DATABASE()
--   AND table_name IN (
--    'users','wallet_transactions','app_settings','notification_settings',
--    'role_permissions','products','payments','customers','employees'
--   )
-- ORDER BY table_name;
--
-- SELECT COUNT(*) AS users_count FROM users;
-- SELECT COUNT(*) AS wallet_tx_count FROM wallet_transactions;
-- SELECT COUNT(*) AS role_perm_count FROM role_permissions;
-- SELECT COUNT(*) AS app_settings_count FROM app_settings;

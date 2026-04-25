-- Fill missing data after partial export restore
-- Run after importing your latest SQL dump
-- DB should already be selected: u221106554_tiktakwater

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Employees
INSERT INTO employees (name, phone, email, role, status, assigned_area)
SELECT * FROM (
  SELECT 'Imran Khan', '0301-1111111', 'imran@waterdist.pk', 'field_worker', 'active', 'Gulberg, Model Town'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone = '0301-1111111');

INSERT INTO employees (name, phone, email, role, status, assigned_area)
SELECT * FROM (
  SELECT 'Tariq Mehmood', '0302-2222222', 'tariq@waterdist.pk', 'field_worker', 'active', 'DHA, Old City'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone = '0302-2222222');

INSERT INTO employees (name, phone, email, role, status, assigned_area)
SELECT * FROM (
  SELECT 'Naveed Akhtar', '0303-3333333', 'naveed@waterdist.pk', 'field_worker', 'active', 'Wapda Town, Kot Lakhpat'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone = '0303-3333333');

-- Customers
INSERT INTO customers (
  customer_id, qr_token, name, phone, alt_phone, address, area, zone, route, customer_type, status, joining_date, wallet_balance, notes, assigned_worker_id
)
SELECT
  'WD-1001', UUID(), 'Ahmad Hassan', '0301-1234567', '0321-7654321',
  'House 12, Block A, Gulberg III', 'Gulberg', 'Central', 'Route A1', 'residential', 'active', '2024-01-15', 2500.00,
  'Prefers morning delivery', (SELECT id FROM employees WHERE phone = '0301-1111111' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'WD-1001');

INSERT INTO customers (
  customer_id, qr_token, name, phone, alt_phone, address, area, zone, route, customer_type, status, joining_date, wallet_balance, notes, assigned_worker_id
)
SELECT
  'WD-1002', UUID(), 'Fatima Enterprises', '0300-9876543', NULL,
  '45-B, Main Boulevard, DHA Phase 5', 'DHA', 'South', 'Route B2', 'commercial', 'active', '2024-02-20', 8500.00,
  NULL, (SELECT id FROM employees WHERE phone = '0302-2222222' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'WD-1002');

INSERT INTO customers (
  customer_id, qr_token, name, phone, alt_phone, address, area, zone, route, customer_type, status, joining_date, wallet_balance, notes, assigned_worker_id
)
SELECT
  'WD-1003', UUID(), 'Ali Raza', '0333-4567890', NULL,
  'Flat 6, Floor 3, Johar Town', 'Johar Town', 'East', 'Route C1', 'residential', 'active', '2024-03-10', 500.00,
  NULL, (SELECT id FROM employees WHERE phone = '0301-1111111' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'WD-1003');

-- Users (login)
INSERT INTO users (name, email, phone, password_hash, role, status, employee_id, customer_id)
SELECT
  'Hassan Ali', 'admin@waterdist.pk', '0305-5555555', 'admin123', 'admin', 'active', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@waterdist.pk');

INSERT INTO users (name, email, phone, password_hash, role, status, employee_id, customer_id)
SELECT
  'Saira Batool', 'staff@waterdist.pk', '0304-4444444', 'staff123', 'staff', 'active', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff@waterdist.pk');

INSERT INTO users (name, email, phone, password_hash, role, status, employee_id, customer_id)
SELECT
  'Imran Khan', 'worker@waterdist.pk', '0301-1111111', 'worker123', 'field_worker', 'active',
  (SELECT id FROM employees WHERE phone = '0301-1111111' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'worker@waterdist.pk');

INSERT INTO users (name, email, phone, password_hash, role, status, employee_id, customer_id)
SELECT
  'Ahmad Hassan', 'client@waterdist.pk', '0301-1234567', 'client123', 'client', 'active', NULL,
  (SELECT id FROM customers WHERE customer_id = 'WD-1001' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client@waterdist.pk');

-- Inventory
INSERT INTO inventory_items (name, category, unit, current_stock, min_stock_level, unit_cost, last_restocked, status)
SELECT * FROM (
  SELECT '19L Water Cans', 'Containers', 'pieces', 450, 100, 15.00, '2026-04-06', 'active'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = '19L Water Cans');

INSERT INTO inventory_items (name, category, unit, current_stock, min_stock_level, unit_cost, last_restocked, status)
SELECT * FROM (
  SELECT '10L Water Bottles', 'Containers', 'pieces', 300, 80, 10.00, '2026-04-05', 'active'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = '10L Water Bottles');

INSERT INTO inventory_items (name, category, unit, current_stock, min_stock_level, unit_cost, last_restocked, status)
SELECT * FROM (
  SELECT '1.5L Bottles', 'Bottles', 'pieces', 1200, 200, 5.00, '2026-04-07', 'active'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = '1.5L Bottles');

-- Products (linked by inventory item names)
INSERT INTO products (name, description, unit, default_price, inventory_item_id, category, status, stock_quantity)
SELECT
  '19L Water Can', 'Standard 19 liter filtered water can', 'can', 80.00,
  (SELECT id FROM inventory_items WHERE name = '19L Water Cans' LIMIT 1), 'Water', 'active', 450
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '19L Water Can');

INSERT INTO products (name, description, unit, default_price, inventory_item_id, category, status, stock_quantity)
SELECT
  '10L Water Bottle', '10 liter filtered water bottle', 'bottle', 50.00,
  (SELECT id FROM inventory_items WHERE name = '10L Water Bottles' LIMIT 1), 'Water', 'active', 300
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '10L Water Bottle');

INSERT INTO products (name, description, unit, default_price, inventory_item_id, category, status, stock_quantity)
SELECT
  '1.5L Mineral Water', '1.5 liter mineral water bottle', 'bottle', 30.00,
  (SELECT id FROM inventory_items WHERE name = '1.5L Bottles' LIMIT 1), 'Water', 'active', 1200
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '1.5L Mineral Water');

-- Routes and assignments
INSERT INTO routes (name, area, zone, status)
SELECT * FROM (SELECT 'Route A1', 'Gulberg', 'Central', 'active') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE name = 'Route A1');
INSERT INTO routes (name, area, zone, status)
SELECT * FROM (SELECT 'Route B2', 'DHA', 'South', 'active') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE name = 'Route B2');
INSERT INTO routes (name, area, zone, status)
SELECT * FROM (SELECT 'Route C1', 'Johar Town', 'East', 'active') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE name = 'Route C1');

INSERT INTO route_workers (route_id, worker_id)
SELECT
  (SELECT id FROM routes WHERE name = 'Route A1' LIMIT 1),
  (SELECT id FROM employees WHERE phone = '0301-1111111' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM route_workers
  WHERE route_id = (SELECT id FROM routes WHERE name = 'Route A1' LIMIT 1)
    AND worker_id = (SELECT id FROM employees WHERE phone = '0301-1111111' LIMIT 1)
);

-- Wallet transaction backfill for current balances
INSERT INTO wallet_transactions (customer_id, type, amount, description, reference_id, balance_after)
SELECT c.id, 'credit', c.wallet_balance, 'Opening balance restore', NULL, c.wallet_balance
FROM customers c
LEFT JOIN wallet_transactions wt ON wt.customer_id = c.id
WHERE wt.id IS NULL AND c.wallet_balance > 0;

SET FOREIGN_KEY_CHECKS = 1;

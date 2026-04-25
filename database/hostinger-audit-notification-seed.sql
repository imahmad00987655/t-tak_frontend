-- Optional seed for audit logs + notifications sanity check
-- Run after selecting DB: u221106554_tiktakwater

SET NAMES utf8mb4;

INSERT INTO notification_settings (setting_key, enabled) VALUES
  ('low_stock_alert', 1),
  ('email_notify', 0),
  ('failed_delivery_alert', 1),
  ('payment_received_alert', 1)
ON DUPLICATE KEY UPDATE enabled = VALUES(enabled);

INSERT INTO audit_logs (actor, action, details)
SELECT 'System', 'Notification check', 'Notification settings initialized'
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs WHERE action = 'Notification check'
);

INSERT INTO audit_logs (actor, action, details)
SELECT 'Admin', 'Seed data check', 'Audit logs are working'
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs WHERE action = 'Seed data check'
);

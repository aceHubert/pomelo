-- 注意：表名中的 po_ 前缀需要人工替换。
-- 生产环境部署时必须手动修改 client secret 密钥，禁止直接使用初始化示例值。
INSERT INTO `po_client_secrets` (`client_id`, `description`, `expires_at`, `type`, `value`, `created_at`) VALUES ('1',NULL,NULL,'SharedSecret','55c02a1df42f8baa4c26f83aabee9d04a2369051df8b4cd1d8da589640723207',now());
INSERT INTO `po_client_secrets` (`client_id`, `description`, `expires_at`, `type`, `value`, `created_at`) VALUES ('2',NULL,NULL,'SharedSecret','4c2a29bf6b66c4174a121de5e62fb33a25cf123bdb01b9c96c8bbfa53a68b9b2',now());
INSERT INTO `po_client_secrets` (`client_id`, `description`, `expires_at`, `type`, `value`, `created_at`) VALUES ('3',NULL,NULL,'SharedSecret','ea7441ccb965e5b91752bd78adee6e7d32dfb8d93dfe65e15c5c4f02824d5e0b',now());

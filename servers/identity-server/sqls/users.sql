-- 注意：表名中的 po_ 前缀需要人工替换。
CREATE TABLE IF NOT EXISTS `po_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `login_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Login name',
  `login_pwd` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Login password',
  `nice_name` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Nice name (display at the URL address, must be unique)',
  `display_name` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Display name (display at the front-end apps)',
  `mobile` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Phone number',
  `email` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Email address',
  `url` varchar(200) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Home URL address',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'User status (0 for disabled or 1 for enabled, default: disabled)',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_name` (`login_name`),
  UNIQUE KEY `nice_name` (`nice_name`),
  UNIQUE KEY `mobile` (`mobile`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Users';

-- 默认管理员初始密码：a123456。初始化完成后必须立即修改密码。
INSERT INTO `po_users` (`login_name`, `login_pwd`, `nice_name`, `display_name`, `mobile`, `email`, `url`, `status`, `created_at`, `updated_at`) VALUES ('admin','9f447e36a600477cf1b74d6b97df2848','Admin','Admin','+8613800138000','11@11.com','',1,now(),now());

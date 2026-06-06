-- 注意：表名中的 po_ 前缀需要人工替换。
CREATE TABLE IF NOT EXISTS `po_usermeta` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User id',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Meta key',
  `meta_value` longtext COLLATE utf8mb4_unicode_520_ci COMMENT 'Meta value',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_meta_keys` (`user_id`,`meta_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='User metas';

INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'nick_name','Admin');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'first_name','');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'last_name','');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'avatar','');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'description','Administrator');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'locale','zh-CN');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'admin_color','{\"layout\":{\"type\":\"mixedmenu\",\"contentWidth\":\"fluid\",\"fixedHeader\":true,\"fixSiderbar\":true,\"sideCollapsed\":\"disabled\",\"colorWeak\":false,\"autoHideHeader\":false,\"multiTab\":false},\"theme\":\"auto\",\"primaryColor\":\"#13C2C2\"}');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'super_administrator','1');
INSERT INTO `po_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES ((SELECT `id` FROM `po_users` WHERE `login_name` = 'admin' LIMIT 1),'po_capabilities','administrator');

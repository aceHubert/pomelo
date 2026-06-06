-- 注意：仅用于历史库手动写入 migration 记录。
-- 前提：确认当前库已经存在 identity-server 所需全部业务表，且结构与当前模型一致。
-- 执行后 Umzug 会认为下列 migrations 已执行，不会再自动创建这些表。
CREATE TABLE IF NOT EXISTS `sequelize_meta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `sequelize_meta_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT IGNORE INTO `sequelize_meta` (`name`) VALUES
  ('001-create-api-resources.js'),
  ('002-create-api-claims.js'),
  ('003-create-api-scope-claims.js'),
  ('004-create-api-scopes.js'),
  ('005-create-api-secrets.js'),
  ('006-create-api-properties.js'),
  ('007-create-identity-resources.js'),
  ('008-create-identity-claims.js'),
  ('009-create-identity-properties.js'),
  ('010-create-clients.js'),
  ('011-create-client-claims.js'),
  ('012-create-client-cors-origins.js'),
  ('013-create-client-scopes.js'),
  ('014-create-client-grant-types.js'),
  ('015-create-client-post-logout-redirect-uris.js'),
  ('016-create-client-redirect-uris.js'),
  ('017-create-client-secrets.js'),
  ('018-create-client-properties.js');

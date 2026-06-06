-- 注意：仅用于历史库手动写入 migration 记录。
-- 前提：确认当前库已经存在 infrastructure-service 所需全部业务表，且结构与当前模型一致。
-- 执行后 Umzug 会认为下列 migrations 已执行，不会再自动创建这些表。
CREATE TABLE IF NOT EXISTS `sequelize_meta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `sequelize_meta_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT IGNORE INTO `sequelize_meta` (`name`) VALUES
  ('001-create-users.js'),
  ('002-create-user-meta.js'),
  ('003-create-options.js'),
  ('004-create-links.js'),
  ('005-create-medias.js'),
  ('006-create-media-meta.js'),
  ('007-create-templates.js'),
  ('008-create-template-meta.js'),
  ('009-create-term-taxonomy.js'),
  ('010-create-term-taxonomy-meta.js'),
  ('011-create-term-relationships.js'),
  ('012-create-comments.js'),
  ('013-create-comment-meta.js');

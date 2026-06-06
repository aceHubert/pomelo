-- 注意：表名中的 po_ 前缀需要人工替换。
-- 部署前需要按实际环境手动修改域名配置。
INSERT INTO `po_client_redirect_uris` (`client_id`, `redirect_uri`) VALUES ('3','https://localhost:5011/signin');
INSERT INTO `po_client_redirect_uris` (`client_id`, `redirect_uri`) VALUES ('3','https://localhost:5011/signin.html');
INSERT INTO `po_client_redirect_uris` (`client_id`, `redirect_uri`) VALUES ('3','https://localhost:5011/signin-silent');
INSERT INTO `po_client_redirect_uris` (`client_id`, `redirect_uri`) VALUES ('3','https://localhost:5011/signin-silent.html');

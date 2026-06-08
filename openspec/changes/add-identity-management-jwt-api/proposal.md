## Why

identity-server 目前已有完整的 OIDC 管理 GraphQL resolver，但站内管理工具若只需要直连本站，不应被迫走完整 OIDC 授权码、回跳和 consent 流程。新增管理专用 JWT 登录与 REST/OpenAPI 对等接口，可以让独立 `management.html` 以更简单的方式管理 Clients、API Resources、Identity Resources 等配置，同时继续复用现有授权体系。

## What Changes

- 为 identity-server 增加管理专用登录能力，代码放在 `servers/identity-server/src/apis/auth`，同时提供 GraphQL mutation 与 OpenAPI `POST /v0/management/auth/login`。
- 管理登录只允许超级管理员账号使用，登录成功后签发本站 JWT，前端通过 `Authorization: Bearer <token>` 访问 GraphQL 和 OpenAPI。
- 本站登录签发的 JWT 携带完整 RAM allow 策略，覆盖 identity-server 管理操作所需 action。
- 在 `AuthorizationModule` 配置中传入 `signingKey` 与管理 JWT 过期时间，保持包内现有默认私钥 warning 逻辑不变。
- 为当前只有 resolver 的 Clients、API Resources、Identity Resources 管理能力增加 REST controller，所有 REST controller API 路径统一以 `/v0/management` 为前缀，并补充 Swagger Bearer 授权声明。
- 新增 `clients/identity-server-management` React 管理端，等价迁移现有 Vue TSX OIDC 管理功能，覆盖 Clients、API Resources、Identity Resources 及其子菜单配置。
- React 管理端使用 Apollo Client React 官方 `useQuery`/`useMutation` 调用 GraphQL，并通过 GraphQL `managementLogin` 获取 JWT；登录 token 存入 localStorage，并在请求中注入 Bearer JWT。
- React 管理端构建为单文件静态 `management.html`，输出到 identity-server 可独立运行的位置。
- 不移除、不替换现有 OIDC 流程；OIDC 登录、token endpoint、userinfo、introspection 等行为保持不变。

## Capabilities

### New Capabilities

- `identity-management-direct-auth`: identity-server 提供站内管理登录，支持 GraphQL/OpenAPI，签发可访问管理接口的 JWT。
- `identity-management-openapi`: identity-server 为现有 Clients、API Resources、Identity Resources 管理能力提供 REST/OpenAPI 对等接口。
- `identity-management-react-app`: 提供独立 React 管理端，等价迁移现有 web OIDC 管理页面并构建为单文件 `management.html`。

### Modified Capabilities

无。

## Impact

- 影响 `servers/identity-server/src/app.module.ts` 中 `AuthorizationModule` 的配置。
- 在 `servers/identity-server/src/apis/auth` 新增 management auth resolver/controller、输入输出模型、超级管理员校验逻辑。
- 新增 Clients、API Resources、Identity Resources 的 REST controller，统一使用 `/v0/management` API 前缀，复用现有 datasource 与 RAM action。
- 新增 `clients/identity-server-management` workspace/package，包含 React 路由、登录页、GraphQL hooks、管理页面和单文件构建配置。
- identity-server 构建/静态资源流程需要接收或复制 `management.html`，使其可由 identity-server 独立托管。
- Swagger/OpenAPI 文档将新增管理登录接口和管理资源接口，并声明 Bearer JWT 授权。
- React 独立管理端后续可使用 localStorage 保存 JWT 并直接调用 identity-server GraphQL/OpenAPI。

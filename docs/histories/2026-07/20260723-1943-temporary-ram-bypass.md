# 临时放行 Basic RAM 权限

- Git User: hubert <hubert@lejian.com>
- Date: 2026-07-23

## Summary

- 将 OIDC access token 的空 RAM 策略替换为临时 `basic:*` Allow 策略。
- 该策略用于验证当前 403 是否由 RAM Guard 引起。

## Verification

- `git diff --check`

## Change Stats

```text
1 file changed, 6 insertions(+), 2 deletions(-)
6	2	servers/identity-server/src/oidc-config/oidc-config.service.ts
```

## Deferred

- 验证完成后移除临时通配策略，并改为按用户持久化和签发最小权限策略。

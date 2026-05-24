## 项目插件目录

每个插件一个目录，目录中必须提供 `manifest.json`。

示例：

```text
plugins/
└── controller-test/
    ├── manifest.json
    └── server/index.js
```

启用状态不写在 manifest 中，而是通过 options 表的 `active_plugins` 配置。
包含 Nest Controller、Resolver 或 Provider 的插件需要在 WebUI 更新配置后重启 BFF 才会生效。

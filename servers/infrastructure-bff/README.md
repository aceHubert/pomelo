# @ace-pomelo/infrastructure-bff

> Pomelo BFF Server
> GraphQL Support

<br/>

## runtime 环境变量

| 变量名      | 描述                   | 默认值                                               |
| ----------- | ---------------------- | ---------------------------------------------------- |
| ENV_FILE    | 使用指定的.env 文件    | 开发环境使用 .env.development<br/> 生产环境使用 .env |
| CONFIG_FILE | 读取 yaml 文件配置合并 | {cwd()}/config/config.yaml                           |

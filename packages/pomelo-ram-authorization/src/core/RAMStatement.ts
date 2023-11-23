/**
 * 授权语句。
 */
export class RAMStatement {
  /**
   * 授权类型。Effect 取值 为 Allow 或 Deny。比如，"Effect": "Allow"
   */
  Effect!: string;
  /**
   * 操作名称列表
   * Action支持多值，取值为定义的API操作名称，其格式定义如下：
   * &lt;service-name&gt;:&lt;action-name&gt;
   * 格式说明：
   * service-name: API服务名称，如 isp, cp, hc, points 等。
   * action-name: service 相关的 api 操作接口名称。
   * 描述样例：
   * "Action": ["cp:ListProducts", "isp:Describe*", "cp:Describe*"]
   */
  Action?: string[];
  /**
   * 操作对象列表。
   * Resource 通常指操作对象，比如 ISP 用户对象，RES 存储对象。我们使用如下格式来命名资源。
   * ks:&lt;service-name&gt;:&lt;relative-id&gt;
   * ks: 康岁的首字母缩写
   * service-name: 康岁提供的API服务名称，如 ips, cp 等。
   * relative-id: 与 service 相关的资源描述部分，其语义由具体 service 指定。
   *     这部分的格式描述支持类似于一个文件路径的树状结构。
   *     以 res 为例，relative-id = “res/dir1/object1.jpg” 表示一个 RES 对象。
   * 描述样例：
   * "Resource": ["ks:isp:article/001", "ks:cp:product/*"]
   */
  Resource?: string[];

  constructor(init?: Partial<RAMStatement>) {
    Object.assign(this, init);
  }
}

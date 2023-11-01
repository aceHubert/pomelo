import { RAMStatement } from './RAMStatement';

/// <summary>
/// 授权策略（Policy）。
/// </summary>
/// <remarks>
/// RAM 中使用授权策略（Policy）来描述授权的具体内容，授权内容包含以下基本因素：效力（Effect）、资源（Resource）、对资源所授予的操作权限（Action）。
/// </remarks>
export class RAMPolicy {
  /// <summary>
  /// 策略名称。
  /// </summary>
  PolicyName: string;
  /// <summary>
  /// 授权语句。
  /// </summary>
  /// <remarks>
  /// 一个 Policy 可以有多条授权语句。
  /// 每条授权语句要么是 Deny，要么是 Allow。一条授权语句中，Action 是一个支持多个操作的列表，Resource 也是一个支持多个对象的列表。
  /// </remarks>
  Statements?: RAMStatement[];

  /// <summary>
  /// 初始化类 <see cref="RAMPolicy"/>。
  /// </summary>
  /// <param name="name"></param>
  constructor(name: string) {
    this.PolicyName = name;
  }
}

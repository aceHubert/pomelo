import { Injectable } from '@nestjs/common';

import { AuthorizeEffect } from '../core/AuthorizeEffect';
import { RAMPolicy } from '../core/RAMPolicy';
import { RAMStatement } from '../core/RAMStatement';
import { IRamPolicyProvider, PolicySourceType } from './ram-policy-provider.interface';

/**
 * JWT Claims 中的压缩格式策略
 */
interface CompressedPolicy {
  /** Policy Name */
  pn: string;
  /** Statements */
  st: CompressedStatement[];
}

/**
 * JWT Claims 中的压缩格式语句
 */
interface CompressedStatement {
  /** Effect: 'A' = Allow, 'D' = Deny */
  e: 'A' | 'D';
  /** Actions */
  a?: string[];
  /** Resources */
  r?: string[];
}

/**
 * JWT Claims 策略提供者
 * 从 JWT token 的 claims 中解析 RAM 策略
 */
@Injectable()
export class JwtClaimsPolicyProvider implements IRamPolicyProvider {
  readonly sourceType = PolicySourceType.JwtClaims;
  readonly priority = 0;

  constructor(private readonly claimName: string = 'ram') {}

  async getPolicies(user: Record<string, any>): Promise<RAMPolicy[]> {
    const ramClaims = user[this.claimName];
    if (!ramClaims) return [];

    return this.parseClaimsToPolicy(ramClaims);
  }

  /**
   * 解析 JWT Claims 中的策略
   * 支持两种格式：
   * 1. 压缩格式（用于减少 token 大小）
   * 2. 标准格式
   */
  private parseClaimsToPolicy(ramClaims: any): RAMPolicy[] {
    // 如果是数组，处理多个策略
    if (Array.isArray(ramClaims)) {
      return ramClaims.flatMap((claim) => this.parseSingleClaim(claim));
    }

    return this.parseSingleClaim(ramClaims);
  }

  private parseSingleClaim(claim: any): RAMPolicy[] {
    if (!claim) return [];

    // 压缩格式
    if (claim.pn && claim.st) {
      return [this.parseCompressedPolicy(claim as CompressedPolicy)];
    }

    // 标准格式
    if (claim.PolicyName && claim.Statements) {
      return [this.parseStandardPolicy(claim)];
    }

    return [];
  }

  private parseCompressedPolicy(compressed: CompressedPolicy): RAMPolicy {
    const policy = new RAMPolicy(compressed.pn);
    policy.Statements = compressed.st.map((st) => {
      const statement = new RAMStatement();
      statement.Effect = st.e === 'A' ? AuthorizeEffect.Allow : AuthorizeEffect.Deny;
      statement.Action = st.a;
      statement.Resource = st.r;
      return statement;
    });
    return policy;
  }

  private parseStandardPolicy(standard: any): RAMPolicy {
    const policy = new RAMPolicy(standard.PolicyName);
    policy.Statements = (standard.Statements || []).map((st: any) => {
      const statement = new RAMStatement();
      statement.Effect = st.Effect === 'ALLOW' || st.Effect === 'Allow' ? AuthorizeEffect.Allow : AuthorizeEffect.Deny;
      statement.Action = st.Action;
      statement.Resource = st.Resource;
      return statement;
    });
    return policy;
  }
}

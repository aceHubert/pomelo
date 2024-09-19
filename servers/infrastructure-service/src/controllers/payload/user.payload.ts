import { Type } from 'class-transformer';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsEnum,
  IsIn,
  IsString,
  IsNotEmpty,
  IsArray,
  IsLocale,
  IsHexColor,
  IsPositive,
  IsPhoneNumber,
  IsEmail,
  MinLength,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';
import { PagedQueryPayload, RequestUserIdPayload } from './common.payload';
import { NewMetaPayload } from './meta.payload';

export class IdOrUserNamePayload {
  @IsOptional()
  @IsPositive()
  id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;
}

/**
 * 用户分页查询条件
 */
export class PagedUserQueryPayolad extends PagedQueryPayload {
  /**
   * 根据 loginName, displayName 模糊查询
   */
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * 状态
   */
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * 角色
   */
  @IsOptional()
  @IsString()
  @IsIn(Object.values(UserRole))
  capabilities?: string;
}

/**
 * 添加新用户实体
 */
export class NewUserPayload extends RequestUserIdPayload {
  loginName!: string;
  loginPwd!: string;
  niceName!: string;
  displayName!: string;
  mobile?: string;
  email?: string;
  url!: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
  /** fixed metas */

  firstName?: string;
  lastName?: string;
  avator?: string;
  description?: string;

  /**
   * 管理员主题色
   */
  @IsOptional()
  @IsHexColor()
  adminColor?: string;

  /**
   * 用户语言
   */
  @IsOptional()
  @IsLocale()
  locale?: string;

  /**
   * 角色
   */
  @IsOptional()
  @IsString()
  @IsIn(Object.values(UserRole))
  capabilities?: string;

  /** extra metas */

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NewMetaPayload)
  metas?: NewMetaPayload[];
}

/**
 * 修改用户模块
 */
export class UpdateUserPayload extends IntersectionType(
  PartialType(
    PickType(NewUserPayload, [
      'status',
      'displayName',
      'firstName',
      'lastName',
      'url',
      'avator',
      'description',
      'adminColor',
      'locale',
      'capabilities',
    ] as const),
  ),
  RequestUserIdPayload,
) {
  /**
   * 用户ID
   */
  @IsPositive()
  id!: number;

  /**
   * 昵称
   */
  nickName?: string;
}

export class UpdateUserEmailPayload extends RequestUserIdPayload {
  @IsPositive()
  id!: number;

  @IsString()
  @IsEmail()
  email!: string;
}

export class UpdateUserMobilePayload extends RequestUserIdPayload {
  @IsPositive()
  id!: number;

  @IsString()
  @IsPhoneNumber()
  mobile!: string;
}

export class UpdateUserStatusPayload extends RequestUserIdPayload {
  @IsPositive()
  id!: number;

  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class UpdateLoginPwdPayload extends IdOrUserNamePayload {
  @IsString()
  @MinLength(6)
  oldPwd!: string;

  @IsString()
  @MinLength(6)
  newPwd!: string;
}

export class VerifyUserPayload {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class DeleteUserPayLoad extends RequestUserIdPayload {
  @IsPositive()
  id!: number;
}

export class BulkDeleteUserPayload extends RequestUserIdPayload {
  @IsArray()
  @ArrayNotEmpty()
  @IsPositive({ each: true })
  ids!: number[];
}

import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserModel, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'User model' })
export class User implements UserModel {
  @Field((type) => ID, { description: 'User id' })
  id!: number;

  @Field({ description: 'Login name' })
  loginName!: string;

  @Field({ description: 'Nice name' })
  niceName!: string;

  @Field({ description: 'Display name' })
  displayName!: string;

  @Field({ description: 'Mobile' })
  mobile!: string;

  @Field({ description: 'Email' })
  email!: string;

  @Field({ description: 'Client url' })
  url!: string;

  @Field((type) => UserStatus, { description: 'Status' })
  status!: UserStatus;

  @Field({ description: 'Latest update time' })
  updatedAt!: Date;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Paged user model' })
export class PagedUser extends PagedResponse(User) {}

@ObjectType({ description: 'User meta' })
export class UserMeta extends Meta {
  @Field((type) => ID, { description: 'User id' })
  userId!: number;
}

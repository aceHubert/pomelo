import { InputType, Field } from '@nestjs/graphql';
import { UserRole } from '@ace-pomelo/infrastructure-datasource';
import { NewUserValidator } from './new-user.validator';

@InputType({ description: 'New user input' })
export class NewUserInput extends NewUserValidator {
  @Field({ description: 'Login name' })
  loginName!: string;

  @Field({ description: 'Login password' })
  loginPwd!: string;

  @Field({ nullable: true, description: 'First name' })
  firstName?: string | undefined;

  @Field({ nullable: true, description: 'Last name' })
  lastName?: string | undefined;

  @Field({ nullable: true, description: 'Avator' })
  avator?: string | undefined;

  @Field({ nullable: true, description: 'Description' })
  description?: string | undefined;

  @Field({ nullable: true, description: 'Admin color' })
  adminColor?: string | undefined;

  @Field(() => UserRole, { nullable: true, description: 'User role' })
  capabilities?: UserRole | undefined;

  @Field({ nullable: true, description: 'Locale' })
  locale?: string | undefined;

  @Field({ description: 'Email' })
  email!: string;

  @Field({ description: 'Mobile' })
  mobile!: string;

  @Field({ description: 'Client url' })
  url!: string;
}

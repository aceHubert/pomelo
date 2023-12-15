import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewIdentityPropertyInput } from '@ace-pomelo/identity-datasource';

export abstract class NewIdentityPropertyValidator implements NewIdentityPropertyInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract key: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract value: string;
}

import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewIdentityPropertyInput } from '@/datasource';

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

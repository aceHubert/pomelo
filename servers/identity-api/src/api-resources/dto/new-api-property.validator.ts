import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewApiPropertyInput } from '@ace-pomelo/identity-datasource';

export abstract class NewApiPropertyValidator implements NewApiPropertyInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract key: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract value: string;
}

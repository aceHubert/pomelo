import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewClientGrantTypeInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientGrantTypeValidator implements NewClientGrantTypeInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract grantType: string;
}

import { IsDefined, IsUrl } from 'class-validator';
import { NewClientCorsOriginInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientCorsOriginValidator implements NewClientCorsOriginInput {
  @IsDefined()
  @IsUrl()
  abstract origin: string;
}

import { IsDefined, IsUrl } from 'class-validator';
import { NewClientRedirectUriInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientRedirectUriValidator implements NewClientRedirectUriInput {
  @IsDefined()
  @IsUrl()
  abstract redirectUri: string;
}

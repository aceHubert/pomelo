import { IsDefined, IsUrl } from 'class-validator';
import { NewClientPostLogoutRedirectUriInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientPostLogoutRedirectUriValidator implements NewClientPostLogoutRedirectUriInput {
  @IsDefined()
  @IsUrl()
  abstract postLogoutRedirectUri: string;
}

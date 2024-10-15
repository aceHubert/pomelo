import { IsDefined, IsUrl } from 'class-validator';
import { NewClientPostLogoutRedirectUriInput } from '@/datasource';

export abstract class NewClientPostLogoutRedirectUriValidator implements NewClientPostLogoutRedirectUriInput {
  @IsDefined()
  @IsUrl({ require_tld: false, require_protocol: true })
  abstract postLogoutRedirectUri: string;
}

import { IsDefined, IsUrl } from 'class-validator';
import { NewClientRedirectUriInput } from '@/datasource';

export abstract class NewClientRedirectUriValidator implements NewClientRedirectUriInput {
  @IsDefined()
  @IsUrl({ require_tld: false, require_protocol: true })
  abstract redirectUri: string;
}

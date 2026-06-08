import { InputType } from '@nestjs/graphql';
import { NewClientPostLogoutRedirectUriValidator } from './new-client-post-logout-redirect-uri.validator';

@InputType({ description: 'New client redirect uri input' })
export class NewClientPostLogoutRedirectUriInput extends NewClientPostLogoutRedirectUriValidator {
  /**
   * Post logout redirect uri
   */
  postLogoutRedirectUri!: string;
}

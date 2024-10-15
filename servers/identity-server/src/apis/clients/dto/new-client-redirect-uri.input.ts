import { InputType } from '@nestjs/graphql';
import { NewClientRedirectUriValidator } from './new-client-redirect-uri.validator';

@InputType({ description: 'New client redirect uri input' })
export class NewClientRedirectUriInput extends NewClientRedirectUriValidator {
  /**
   * Redirect uri
   */
  redirectUri!: string;
}

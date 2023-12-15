import { InputType, Field } from '@nestjs/graphql';
import { NewClientPostLogoutRedirectUriValidator } from './new-client-post-logout-redirect-uri.validator';

@InputType({ description: 'New client redirect uri input' })
export class NewClientPostLogoutRedirectUriInput extends NewClientPostLogoutRedirectUriValidator {
  @Field({ description: 'Post logout redirect uri' })
  postLogoutRedirectUri!: string;
}

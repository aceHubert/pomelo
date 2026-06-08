import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Anonymous } from '@ace-nestjs/authorization';
import { ManagementLoginInput } from './dto/login.input';
import { ManagementTokenResponse } from './models/token.model';
import { ManagementAccountService } from './account.service';

@Resolver()
export class ManagementAccountResolver {
  constructor(private readonly accountService: ManagementAccountService) {}

  @Anonymous()
  @Mutation(() => ManagementTokenResponse, { description: 'Login for identity management.' })
  signin(@Args('input', { type: () => ManagementLoginInput }) input: ManagementLoginInput) {
    return this.accountService.login(input);
  }
}

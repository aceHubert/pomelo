import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Anonymous, Authorized } from '@ace-nestjs/authorization';
import { RequestUser, User } from '@ace-pomelo/shared/server';
import { ManagementLoginInput } from './dto/login.input';
import { ManagementCurrentUser } from './models/user.model';
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

  @Authorized()
  @Query(() => ManagementCurrentUser, { description: 'Get current management user profile.' })
  currentUser(@User() requestUser: RequestUser): Promise<ManagementCurrentUser> {
    return this.accountService.getCurrentUser(requestUser.sub);
  }
}

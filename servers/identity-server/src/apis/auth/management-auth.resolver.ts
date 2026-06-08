import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Anonymous } from '@ace-nestjs/authorization';
import { ManagementLoginInput } from './dto/management-login.input';
import { ManagementTokenResponse } from './models/management-token.model';
import { ManagementAuthService } from './management-auth.service';

@Resolver()
export class ManagementAuthResolver {
  constructor(private readonly managementAuthService: ManagementAuthService) {}

  @Anonymous()
  @Mutation(() => ManagementTokenResponse, { description: 'Login for identity management.' })
  managementLogin(@Args('input', { type: () => ManagementLoginInput }) input: ManagementLoginInput) {
    return this.managementAuthService.login(input);
  }
}

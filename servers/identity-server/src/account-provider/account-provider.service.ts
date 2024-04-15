import { Injectable, Inject } from '@nestjs/common';
import { AccountProviderOptions } from './interfaces/account-provider-options.interface';
import { ACCOUNT_PROVIDER_OPTIONS } from './constants';

@Injectable()
export class AccountProviderService {
  constructor(@Inject(ACCOUNT_PROVIDER_OPTIONS) options: AccountProviderOptions) {
    Object.assign(this, options.adapter());
  }
}

export interface AccountProviderService extends ReturnType<AccountProviderOptions['adapter']> {}

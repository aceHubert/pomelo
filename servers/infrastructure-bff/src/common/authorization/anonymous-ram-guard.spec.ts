import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Anonymous, TokenGuard as AuthorizationTokenGuard } from '@ace-nestjs/authorization';
import { RamAuthorized, TokenGuard as RamTokenGuard } from '@ace-nestjs/ram-authorization';

describe('RamAuthorized with Anonymous', () => {
  it('keeps the RAM guard active', () => {
    class TestController {
      @Anonymous()
      @RamAuthorized('template.meta.list')
      handler() {}
    }

    const guards = Reflect.getMetadata(GUARDS_METADATA, TestController.prototype.handler);
    expect(guards).toEqual(expect.arrayContaining([AuthorizationTokenGuard, RamTokenGuard]));
  });
});

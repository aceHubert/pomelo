import { registerEnumType } from '@nestjs/graphql';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User status',
});

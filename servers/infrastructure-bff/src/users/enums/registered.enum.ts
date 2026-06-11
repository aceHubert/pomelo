import { registerEnumType } from '@nestjs/graphql';
import { AuthProvider, UserStatus, UserRole } from '@ace-pomelo/shared/server';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User status',
});

registerEnumType(AuthProvider, {
  name: 'AuthProvider',
  description: 'Third-party auth provider',
});

import { registerEnumType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@ace-pomelo/datasource';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User status',
});

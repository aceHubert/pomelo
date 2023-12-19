import { registerEnumType } from '@nestjs/graphql';
import { UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from './user-role.enum';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User status',
});

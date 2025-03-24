import { registerEnumType } from '@nestjs/graphql';
import { CommentType } from '@ace-pomelo/shared/server';

registerEnumType(CommentType, {
  name: 'CommentType',
  description: 'Comment type',
});

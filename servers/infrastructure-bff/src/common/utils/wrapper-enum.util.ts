import { $enum } from 'ts-enum-util';
import {
  CommentType,
  LinkVisible,
  LinkTarget,
  OptionAutoload,
  TemplateStatus,
  TemplateCommentStatus,
} from '@ace-pomelo/shared/server';

export const WrapperCommentType = $enum(CommentType);
export const WrapperLinkVisible = $enum(LinkVisible);
export const WrapperLinkTarget = $enum(LinkTarget);
export const WrapperOptionAutoload = $enum(OptionAutoload);
export const WrapperTemplateStatus = $enum(TemplateStatus);
export const WrapperTemplateCommentStatus = $enum(TemplateCommentStatus);

import { UserCapability } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from './enums/user-role.enum';

export type UserRoles = Record<
  Exclude<UserRole, UserRole.None>,
  {
    name: string;
    capabilities: UserCapability[];
  }
>;

export const getDefaultUserRoles = (): UserRoles => {
  return {
    [UserRole.Administrator]: {
      name: 'Administrator',
      capabilities: Object.values(UserCapability),
    },
    [UserRole.Editor]: {
      name: 'Editor',
      capabilities: [
        UserCapability.ModerateComments,
        UserCapability.ManageCategories,
        UserCapability.ManageLinks,
        UserCapability.UploadFiles,
        UserCapability.EditTemplates,
        UserCapability.EditOthersTemplates,
        UserCapability.EditPublishedTemplates,
        UserCapability.EditPrivateTemplates,
        UserCapability.DeleteTemplates,
        UserCapability.DeleteOthersTemplates,
        UserCapability.DeletePublishedTemplates,
        UserCapability.DeletePrivateTemplates,
        UserCapability.PublishTemplates,
        UserCapability.ReadPrivate,
        UserCapability.Read,
      ],
    },
    [UserRole.Author]: {
      name: 'Author',
      capabilities: [
        UserCapability.UploadFiles,
        UserCapability.EditTemplates,
        UserCapability.EditPublishedTemplates,
        UserCapability.DeleteTemplates,
        UserCapability.DeletePublishedTemplates,
        UserCapability.PublishTemplates,
        UserCapability.Read,
      ],
    },
    [UserRole.Contributor]: {
      name: 'Contributor',
      capabilities: [UserCapability.EditTemplates, UserCapability.DeleteTemplates, UserCapability.Read],
    },
    [UserRole.Subscriber]: {
      name: 'Subscriber',
      capabilities: [UserCapability.Read],
    },
  };
};

import { UserCapability } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from './enums/user-role.enum';

export type UserRoles = Record<
  UserRole,
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
        UserCapability.EditPosts,
        UserCapability.EditOthersPosts,
        UserCapability.EditPublishedPosts,
        UserCapability.EditPrivatePosts,
        UserCapability.DeletePosts,
        UserCapability.DeleteOthersPosts,
        UserCapability.DeletePublishedPosts,
        UserCapability.DeletePrivatePosts,
        UserCapability.PublishPosts,
        UserCapability.EditPages,
        UserCapability.EditOthersPages,
        UserCapability.EditPublishedPages,
        UserCapability.EditPrivatePages,
        UserCapability.DeletePages,
        UserCapability.DeleteOthersPages,
        UserCapability.DeletePublishedPages,
        UserCapability.DeletePrivatePages,
        UserCapability.PublishPages,
        UserCapability.EditForms,
        UserCapability.EditOthersForms,
        UserCapability.EditPublishedForms,
        UserCapability.EditPrivateForms,
        UserCapability.DeleteForms,
        UserCapability.DeleteOthersForms,
        UserCapability.DeletePublishedForms,
        UserCapability.DeletePrivateForms,
        UserCapability.PublishForms,
        UserCapability.ReadPrivatePosts,
        UserCapability.ReadPrivatePages,
        UserCapability.ReadPrivateForms,
        UserCapability.Read,
      ],
    },
    [UserRole.Author]: {
      name: 'Author',
      capabilities: [
        UserCapability.UploadFiles,
        UserCapability.EditPosts,
        UserCapability.EditPublishedPosts,
        UserCapability.DeletePosts,
        UserCapability.DeletePublishedPosts,
        UserCapability.PublishPosts,
        UserCapability.Read,
      ],
    },
    [UserRole.Contributor]: {
      name: 'Contributor',
      capabilities: [UserCapability.EditPosts, UserCapability.DeletePosts, UserCapability.Read],
    },
    [UserRole.Subscriber]: {
      name: 'Subscriber',
      capabilities: [UserCapability.Read],
    },
  };
};

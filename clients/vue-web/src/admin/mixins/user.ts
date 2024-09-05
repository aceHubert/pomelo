import { reactive } from '@vue/composition-api';
import { OptionPresetKeys } from '@ace-pomelo/shared/client';
import { useOptions } from '@/hooks';

export const useUserMixin = () => {
  const userRoles = useOptions(OptionPresetKeys.UserRoles);

  const userRolesObj = JSON.parse(userRoles.value ?? '{}');

  const getRole = (roleName: string) => {
    const role = userRolesObj[roleName];
    return {
      capabilities: role?.capabilities ?? [],
      hasPermission: (capability: string) => role?.capabilities.includes(capability),
    };
  };

  return reactive({
    getRole,
  });
};

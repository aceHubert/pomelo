import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { message, Card, Checkbox } from 'ant-design-vue';
import { useUserManager } from '@/composables';
import { OptionAutoload, useBasicApi } from '@/fetch/apis/basic';
import { AuthType } from '@/types';
import { AuthTypeOptionName } from '@/constants';

export default defineComponent({
  name: 'AuthType',
  setup() {
    const userManager = useUserManager();
    const basicApi = useBasicApi();
    const optionId = ref<string>();
    const authType = ref<AuthType>();
    const loading = ref(false);

    const loadAuthType = async () => {
      loading.value = true;
      try {
        const { option } = await basicApi.getOptionByName({
          variables: {
            name: AuthTypeOptionName,
          },
        });
        if (option) {
          optionId.value = option.id;
          authType.value = option.value as AuthType;
        }
      } catch {
        message.error('加载身份验证类型失败');
      } finally {
        loading.value = false;
      }
    };

    const handleAuthTypeSave = async (type: AuthType) => {
      authType.value = type;
      loading.value = true;
      try {
        if (optionId.value) {
          await basicApi.updateOption({
            variables: {
              id: optionId.value,
              model: {
                optionValue: authType.value,
              },
            },
          });
        } else {
          await basicApi.createOption({
            variables: {
              model: {
                optionName: AuthTypeOptionName,
                optionValue: type,
                autoload: OptionAutoload.Yes,
              },
            },
          });
        }
        await userManager.removeUser();
        await message.success('保存身份验证类型成功, 请重新登录');
        window.location.reload();
      } catch (error) {
        message.error('保存身份验证类型失败');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadAuthType();
    });

    return () => (
      <Card bordered={false}>
        <h2>认证设置</h2>
        <p class="text--secondary mb-5">
          请通过 apisix 设置 Identity Service 鉴权设置，详细配置请查看
          <a href="https://apisix.apache.org/zh/docs/apisix/plugins/openid-connect/" target="_blank" class="ml-1">
            配置说明
          </a>
          。
        </p>
        <Checkbox
          checked={authType.value === AuthType.Oidc}
          disabled={loading.value}
          onChange={(e) => handleAuthTypeSave(e.target.checked ? AuthType.Oidc : AuthType.Local)}
        >
          开启OpenID Connect协议进行身份验证
        </Checkbox>
      </Card>
    );
  },
});

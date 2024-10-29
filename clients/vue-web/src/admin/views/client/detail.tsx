import { upperFirst, merge, omitBy, isNil } from 'lodash-es';
import { defineComponent, ref, reactive, set, nextTick } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Icon,
  Radio,
  Switch,
  Space,
  Tag,
  Result,
} from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n } from '@/composables';
import { useClientApi } from '@/admin/fetch';
import { MediaList } from '../media/components';
import classes from './detail.module.less';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { ClientModel } from '@/admin/fetch/client';

type ClientDetailProps = {
  form: WrappedFormUtils;
  clientId: string;
};

const getDefaultClientMetadata = (): Partial<ClientModel> => ({
  applicationType: 'web',
  idTokenSignedResponseAlg: 'RS256',
  subjectType: 'public',
  tokenEndpointAuthMethod: 'client_secret_basic',
  requireAuthTime: false,
  requireConsent: false,
  requirePkce: true,
  idTokenLifetime: 600,
  accessTokenFormat: 'jwt',
  accessTokenLifetime: 3600,
  refreshTokenExpiration: 'absolute',
  refreshTokenAbsoluteLifetime: 2592000,
  refreshTokenSlidingLifetime: 1296000,
  authorizationCodeLifetime: 300,
  deviceCodeLifetime: 300,
  backchannelAuthenticationRequestLifetime: 300,
});

export default Form.create({})(
  defineComponent({
    name: 'ClientDetail',
    head() {
      return {
        title: this.$tv('page_client_detail.page_title', '客户端详情') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientDetailProps) {
      const router = useRouter();
      const i18n = useI18n();
      const clientApi = useClientApi();

      const isBasicModalVisable = ref(false);
      const chooseImage = reactive({
        modalVisible: false,
        fieldName: '',
        accept: 'image/*',
      });

      const defaultClientMetadata = getDefaultClientMetadata();
      const $detailRes = createResource((clientId: string) => {
        return clientApi
          .get({
            variables: { clientId },
            catchError: true,
            loading: true,
          })
          .then(
            ({ client }) =>
              client &&
              (merge(getDefaultClientMetadata(), omitBy(client, isNil)) as ClientModel &
                Required<
                  Pick<
                    ClientModel,
                    | 'applicationType'
                    | 'idTokenSignedResponseAlg'
                    | 'subjectType'
                    | 'tokenEndpointAuthMethod'
                    | 'requireAuthTime'
                    | 'requireConsent'
                    | 'requirePkce'
                    | 'idTokenLifetime'
                    | 'accessTokenFormat'
                    | 'accessTokenLifetime'
                    | 'refreshTokenExpiration'
                    | 'refreshTokenAbsoluteLifetime'
                    | 'refreshTokenSlidingLifetime'
                    | 'authorizationCodeLifetime'
                    | 'deviceCodeLifetime'
                    | 'backchannelAuthenticationRequestLifetime'
                  >
                >),
          );
      });

      // 加载客户端详情
      $detailRes.read(props.clientId);

      const updateClientSubmiting = ref(false);
      const handleUpdate = () => {
        props.form.validateFields((err, values) => {
          if (err) return;

          clientApi
            .update({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: () => {
                updateClientSubmiting.value = true;
                return () => (updateClientSubmiting.value = false);
              },
            })
            .then(() => {
              Object.assign($detailRes.$result!, values);
              isBasicModalVisable.value = false;
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const updateStatusSubmiting = ref(false);
      const handleStatusChange = (checked: boolean) => {
        return clientApi
          .update({
            variables: {
              clientId: props.clientId,
              model: {
                enabled: checked,
              },
            },
            loading: () => {
              updateStatusSubmiting.value = true;
              return () => (updateStatusSubmiting.value = false);
            },
          })
          .then(() => {
            $detailRes.$result!.enabled = checked;
          })
          .catch((err) => {
            message.error(err.message);
          });
      };

      const handleFieldChange = (value: any, field: string) => {
        return clientApi
          .update({
            variables: {
              clientId: props.clientId,
              model: {
                [field]: value,
              },
            },
          })
          .then(() => {
            set($detailRes.$result!, field, value);
          })
          .catch((err) => {
            message.error(err.message);
          });
      };

      return () => {
        const { $result: client, $loading } = $detailRes;

        if ($loading) return;

        return client ? (
          <div class={classes.container}>
            <Card bordered={false} size="small">
              <Descriptions
                bordered
                size="small"
                column={{ md: 2, sm: 1, xs: 1 }}
                scopedSlots={{
                  title: () => (
                    <div class="d-flex justify-content-space-between">
                      <span>{i18n.tv('page_client_detail.basic_title', '基本信息')}</span>
                      <Space>
                        {client.enabled && (
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              isBasicModalVisable.value = true;

                              nextTick(() => {
                                props.form.setFieldsValue($detailRes.$result!);
                              });
                            }}
                          >
                            {i18n.tv('common.btn_text.edit', '编辑')}
                          </Button>
                        )}
                      </Space>
                    </div>
                  ),
                }}
              >
                <Descriptions.Item label={i18n.tv('page_client_detail.client_name_label', '客户端名称')}>
                  {client.clientName}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.client_id_label', '客户端ID')}>
                  {client.clientId}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.application_type_label', '客户端类型')}>
                  <Tag color={client.applicationType === 'native' ? 'cyan' : 'green'}>
                    {upperFirst(client.applicationType)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.status_label', '启用状态')}>
                  <Switch
                    disabled={updateStatusSubmiting.value}
                    checked={client.enabled}
                    onChange={(checked: boolean) => handleStatusChange(checked)}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.client_uri_label', '客户端URI')}>
                  {client.clientUri || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.initial_login_uri_label', '初始化登录URI')}>
                  {client.initiateLoginUri || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.logo_uri_label', 'Logo URI')}>
                  {client.logoUri ? <img src={client.logoUri} style="height: 30px" /> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.policy_uri_label', '用户协议')}>
                  {client.policyUri ? (
                    <a href={client.policyUri} target="policy_preview">
                      {i18n.tv('page_client_detail.policy_uri_perview_btn_text', '查看用户协议')}
                    </a>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card bordered={false} size="small" class="mt-2">
              <Descriptions
                bordered
                size="small"
                column={{ md: 2, sm: 1, xs: 1 }}
                scopedSlots={{
                  title: () => (
                    <div class="d-flex justify-content-space-between">
                      <span>{i18n.tv('page_client_detail.authentication_title', '认证')}</span>
                    </div>
                  ),
                }}
              >
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.default_max_age_label', 'Default max age (Minutes)')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest"
                      class="ml-1"
                      target="blank"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="defaultMaxAge"
                        value={client.defaultMaxAge ? client.defaultMaxAge / 60 : void 0}
                        defaultValue={0}
                        min={0}
                        size="small"
                        placeholder="Max age"
                        onChange={(value) => handleFieldChange(value * 60 || null, 'defaultMaxAge')}
                      />
                      <Button
                        key="defaultMaxAge"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() => handleFieldChange(defaultClientMetadata.defaultMaxAge ?? null, 'defaultMaxAge')}
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.defaultMaxAge ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.subject_type_label', 'Subject type')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <Radio.Group
                        key="subjectType"
                        value={client.subjectType}
                        size="small"
                        style="white-space: nowrap;"
                        onChange={(e) => handleFieldChange(e.target.value, 'subjectType')}
                      >
                        <Radio.Button value="public">Public</Radio.Button>
                        <Radio.Button value="pairwise">Pairwise</Radio.Button>
                      </Radio.Group>
                      <Button
                        key="subjectType"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() => handleFieldChange(defaultClientMetadata.subjectType ?? null, 'subjectType')}
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    <Tag color="blue">{client.subjectType}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.sector_identifier_uri_label', 'Sector identifier URI')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <Input
                        key="sectorIdentifierUri"
                        value={client.sectorIdentifierUri}
                        size="small"
                        placeholder="Sector identifier URI"
                        onBlur={(e) => handleFieldChange(e.target.value, 'sectorIdentifierUri')}
                        onPressEnter={(e) => handleFieldChange(e.target.value, 'sectorIdentifierUri')}
                      ></Input>
                      <Button
                        key="sectorIdentifierUri"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.sectorIdentifierUri ?? null, 'sectorIdentifierUri')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.sectorIdentifierUri ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.jwks_uri_label', 'JWKs URI')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <Input
                        key="jwksUri"
                        value={client.jwksUri}
                        size="small"
                        placeholder="JWKs URI"
                        onBlur={(e) => handleFieldChange(e.target.value, 'jwksUri')}
                        onPressEnter={(e) => handleFieldChange(e.target.value, 'jwksUri')}
                      ></Input>
                      <Button
                        key="jwksUri"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() => handleFieldChange(defaultClientMetadata.jwksUri ?? null, 'jwksUri')}
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.jwksUri ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.require_consent_label', 'Require consent')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  <Space>
                    <Switch
                      key="requireConsent"
                      checked={client.requireConsent}
                      disabled={!client.enabled}
                      onChange={(checked: boolean) => handleFieldChange(checked, 'requireConsent')}
                    />
                    {client.enabled && (
                      <Button
                        key="requireConsent"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.requireConsent ?? null, 'requireConsent')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.require_pkce_label', 'Require PKCE')}
                    <a
                      href="https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  <Space>
                    <Switch
                      key="requirePkce"
                      checked={client.requirePkce}
                      disabled={!client.enabled}
                      onChange={(checked: boolean) => handleFieldChange(checked, 'requirePkce')}
                    />
                    {client.enabled && (
                      <Button
                        key="requirePkce"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() => handleFieldChange(defaultClientMetadata.requirePkce ?? null, 'requirePkce')}
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card bordered={false} size="small" class="mt-2">
              <Descriptions
                bordered
                size="small"
                column={{ md: 2, sm: 1, xs: 1 }}
                scopedSlots={{
                  title: () => (
                    <div class="d-flex justify-content-space-between">
                      <span>{i18n.tv('page_client_detail.token_title', '令牌')}</span>
                    </div>
                  ),
                }}
              >
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.id_token_lifetime_label', 'IDToken lifetime (Minutes)')}
                    <a
                      href="https://auth0.com/docs/secure/tokens/id-tokens"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="idTokenLifetime"
                        value={client.idTokenLifetime / 60}
                        defaultValue={5}
                        min={5}
                        size="small"
                        placeholder="IdToken lifetime"
                        onChange={(value) => handleFieldChange(value * 60, 'idTokenLifetime')}
                      />
                      <Button
                        key="idTokenLifetime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.idTokenLifetime ?? null, 'idTokenLifetime')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.idTokenLifetime ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.require_auth_time_label', 'Require auth time')}
                    <a
                      href="https://openid.net/specs/openid-connect-core-1_0.html#IDToken"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  <Space>
                    <Switch
                      key="requireAuthTime"
                      checked={client.requireAuthTime}
                      disabled={!client.enabled}
                      onChange={(checked: boolean) => handleFieldChange(checked, 'requireAuthTime')}
                    />
                    {client.enabled && (
                      <Button
                        key="requireAuthTime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.requireAuthTime ?? null, 'requireAuthTime')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.access_token_format_label', 'AccessToken format')}
                    <a
                      href="https://auth0.com/docs/secure/tokens/access-tokens"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <Radio.Group
                        key="accessTokenFormat"
                        value={client.accessTokenFormat}
                        size="small"
                        style="white-space: nowrap;"
                        onChange={(e) => handleFieldChange(e.target.value, 'accessTokenFormat')}
                      >
                        <Radio.Button value="opaque">Opaque</Radio.Button>
                        <Radio.Button value="jwt">JWT</Radio.Button>
                      </Radio.Group>
                      <Button
                        key="accessTokenFormat"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.accessTokenFormat ?? null, 'accessTokenFormat')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    <Tag color="blue">{client.accessTokenFormat}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.access_token_lifetime_label', 'AccessToken lifetime (Minutes)')}
                    <a
                      href="https://auth0.com/docs/secure/tokens/access-tokens"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="accessTokenLifetime"
                        value={client.accessTokenLifetime / 60}
                        defaultValue={5}
                        min={5}
                        size="small"
                        placeholder="AccessToken lifetime"
                        onChange={(value) => handleFieldChange(value * 60, 'accessTokenLifetime')}
                      />
                      <Button
                        key="accessTokenLifetime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.accessTokenLifetime ?? null, 'accessTokenLifetime')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.accessTokenLifetime ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.refresh_token_expiration_label', 'RefreshToken expiration')}
                    <a
                      href="https://auth0.com/docs/secure/tokens/refresh-tokens"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <Radio.Group
                        key="refreshTokenExpiration"
                        value={client.refreshTokenExpiration}
                        size="small"
                        style="white-space: nowrap;"
                        onChange={(e) => handleFieldChange(e.target.value, 'refreshTokenExpiration')}
                      >
                        <Radio.Button value="absolute">Absolute</Radio.Button>
                        <Radio.Button value="sliding">Sliding</Radio.Button>
                      </Radio.Group>
                      <Button
                        key="refreshTokenExpiration"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(
                            defaultClientMetadata.refreshTokenExpiration ?? null,
                            'refreshTokenExpiration',
                          )
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    <Tag color="blue">{client.refreshTokenExpiration}</Tag>
                  )}
                </Descriptions.Item>
                {client.refreshTokenExpiration === 'absolute' && (
                  <Descriptions.Item>
                    <span slot="label">
                      {i18n.tv(
                        'page_client_detail.refresh_token_absolute_lifetime_label',
                        'RefreshToken absolute lifetime (Days)',
                      )}
                      <a
                        href="https://auth0.com/docs/secure/tokens/refresh-tokens"
                        class="ml-1"
                        target="openid-connect"
                        title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                      >
                        <Icon type="question-circle" />
                      </a>
                    </span>
                    {client.enabled ? (
                      <Space>
                        <InputNumber
                          key="refreshTokenAbsoluteLifetime"
                          value={client.refreshTokenAbsoluteLifetime / 86400}
                          defaultValue={1}
                          min={1}
                          size="small"
                          placeholder="RefreshToken absolute lifetime"
                          onChange={(value) => handleFieldChange(value * 86400, 'refreshTokenAbsoluteLifetime')}
                        />
                        <Button
                          key="refreshTokenAbsoluteLifetime"
                          type="link"
                          size="small"
                          class={classes.resetBtn}
                          onClick={() =>
                            handleFieldChange(
                              defaultClientMetadata.refreshTokenAbsoluteLifetime ?? null,
                              'refreshTokenAbsoluteLifetime',
                            )
                          }
                        >
                          {i18n.tv('common.btn_text.reset', '重置')}
                        </Button>
                      </Space>
                    ) : (
                      client.refreshTokenAbsoluteLifetime ?? '-'
                    )}
                  </Descriptions.Item>
                )}
                {client.refreshTokenExpiration === 'sliding' && (
                  <Descriptions.Item>
                    <span slot="label">
                      {i18n.tv(
                        'page_client_detail.refresh_token_sliding_lifetime_label',
                        'RefreshToken sliding lifetime (Days)',
                      )}
                      <a
                        href="https://auth0.com/docs/secure/tokens/refresh-tokens"
                        class="ml-1"
                        target="openid-connect"
                        title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                      >
                        <Icon type="question-circle" />
                      </a>
                    </span>
                    {client.enabled ? (
                      <Space>
                        <InputNumber
                          key="refreshTokenSlidingLifetime"
                          value={client.refreshTokenSlidingLifetime / 86400}
                          defaultValue={1}
                          min={1}
                          size="small"
                          placeholder="RefreshToken sliding lifetime"
                          onChange={(value) => handleFieldChange(value * 86400, 'refreshTokenSlidingLifetime')}
                        />
                        <Button
                          key="refreshTokenSlidingLifetime"
                          type="link"
                          size="small"
                          class={classes.resetBtn}
                          onClick={() =>
                            handleFieldChange(
                              defaultClientMetadata.refreshTokenSlidingLifetime ?? null,
                              'refreshTokenSlidingLifetime',
                            )
                          }
                        >
                          {i18n.tv('common.btn_text.reset', '重置')}
                        </Button>
                      </Space>
                    ) : (
                      client.refreshTokenSlidingLifetime ?? '-'
                    )}
                  </Descriptions.Item>
                )}
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv(
                      'page_client_detail.authorization_code_lifetime_label',
                      'Authorization code lifetime (Minutes)',
                    )}
                    <a
                      href="https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="authorizationCodeLifetime"
                        value={client.authorizationCodeLifetime / 60}
                        defaultValue={5}
                        min={5}
                        size="small"
                        placeholder="Authorization code lifetime"
                        onChange={(value) => handleFieldChange(value * 60, 'authorizationCodeLifetime')}
                      />
                      <Button
                        key="authorizationCodeLifetime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(
                            defaultClientMetadata.authorizationCodeLifetime ?? null,
                            'authorizationCodeLifetime',
                          )
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.authorizationCodeLifetime ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv('page_client_detail.device_code_lifetime_label', 'Device code lifetime (Minutes)')}
                    <a
                      href="https://auth0.com/docs/get-started/authentication-and-authorization-flow/device-authorization-flow"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="deviceCodeLifetime"
                        value={client.deviceCodeLifetime / 60}
                        defaultValue={5}
                        min={5}
                        size="small"
                        placeholder="Device code lifetime"
                        onChange={(value) => handleFieldChange(value * 60, 'deviceCodeLifetime')}
                      />
                      <Button
                        key="deviceCodeLifetime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(defaultClientMetadata.deviceCodeLifetime ?? null, 'deviceCodeLifetime')
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.deviceCodeLifetime ?? '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item>
                  <span slot="label">
                    {i18n.tv(
                      'page_client_detail.backchannel_authentication_request_lifetime_label',
                      'Backchannel authentication request lifetime (Minutes)',
                    )}
                    <a
                      href="https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html"
                      class="ml-1"
                      target="openid-connect"
                      title={i18n.tv('page_client_detail.field_description_tips', '查看说明')}
                    >
                      <Icon type="question-circle" />
                    </a>
                  </span>
                  {client.enabled ? (
                    <Space>
                      <InputNumber
                        key="backchannelAuthenticationRequestLifetime"
                        value={client.backchannelAuthenticationRequestLifetime / 60}
                        defaultValue={5}
                        min={5}
                        size="small"
                        placeholder="Backchannel authentication request lifetime"
                        onChange={(value) => handleFieldChange(value * 60, 'backchannelAuthenticationRequestLifetime')}
                      />
                      <Button
                        key="backchannelAuthenticationRequestLifetime"
                        type="link"
                        size="small"
                        class={classes.resetBtn}
                        onClick={() =>
                          handleFieldChange(
                            defaultClientMetadata.backchannelAuthenticationRequestLifetime ?? null,
                            'backchannelAuthenticationRequestLifetime',
                          )
                        }
                      >
                        {i18n.tv('common.btn_text.reset', '重置')}
                      </Button>
                    </Space>
                  ) : (
                    client.backchannelAuthenticationRequestLifetime ?? '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Modal
              vModel={isBasicModalVisable.value}
              title={i18n.tv('clients_detail.basic_modal_title', '基本信息修改')}
              closable={false}
              maskClosable={false}
              scopedSlots={{
                footer: () => (
                  <div>
                    <Button disabled={updateClientSubmiting.value} onClick={() => (isBasicModalVisable.value = false)}>
                      {i18n.tv('common.btn_text.cancel', '取消')}
                    </Button>
                    <Button
                      type="primary"
                      class="ml-2"
                      loading={updateClientSubmiting.value}
                      onClick={() => handleUpdate()}
                    >
                      {i18n.tv('common.btn_text.save', '保存')}
                    </Button>
                  </div>
                ),
              }}
            >
              <Form form={props.form} labelCol={{ span: 5 }} wrapperCol={{ span: 15 }}>
                <Form.Item label={i18n.tv('page_client_detail.form.name_label', '客户端ID')}>
                  <Input value={client.clientId} disabled />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.name_label', '客户端名称')}>
                  <Input
                    v-decorator={[
                      'clientName',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_detail.form.name_required', '请输入客户端名称'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_detail.form.name_placeholder', '请输入客户端名称')}
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.application_type_label', '客户端类型')}>
                  <Radio.Group
                    v-decorator={[
                      'applicationType',
                      {
                        initialValue: 'web',
                      },
                    ]}
                  >
                    <Radio.Button value="web">Web</Radio.Button>
                    <Radio.Button value="native">Native</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.client_uri_label', '客户端URI')}>
                  <Input
                    v-decorator={[
                      'clientUri',
                      {
                        rules: [
                          {
                            type: 'url',
                            message: i18n.tv(
                              'page_client_detail.form.client_uri_validator_error',
                              '请输入正确客户端URI',
                            ),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_detail.form.client_uri_placeholder', '请输入客户端URI')}
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.initial_login_uri_label', '初始化登录URI')}>
                  <Input
                    v-decorator={[
                      'initialLoginUri',
                      {
                        rules: [
                          {
                            type: 'url',
                            message: i18n.tv(
                              'page_client_detail.form.initial_login_uri_validator_error',
                              '请输入正确初始化登录URI',
                            ),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv(
                      'page_client_detail.form.initial_login_uri_placeholder',
                      '请输入初始化登录URI',
                    )}
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.logo_uri_label', 'Logo')}>
                  <div
                    class={classes.logoImageSelector}
                    v-decorator={['logoUri']}
                    onClick={() => {
                      chooseImage.accept = 'image/png,image/jpg';
                      chooseImage.fieldName = 'logoUri';
                      chooseImage.modalVisible = true;
                    }}
                  >
                    {props.form.getFieldValue('logoUri') ? (
                      <div class={classes.logoImageCover}>
                        <img
                          src={props.form.getFieldValue('logoUri')}
                          alt="logo-uri"
                          style="object-fit: contain; width: 100%; max-height: 120px;"
                        />
                        <Space class={classes.logoImageCoverActions}>
                          <Button shape="circle" icon="select" />
                          <Button
                            shape="circle"
                            icon="delete"
                            vOn:click_prevent_stop={() => props.form.setFieldsValue({ logoUri: null })}
                          />
                        </Space>
                      </div>
                    ) : (
                      <div class={classes.logoImageAdd}>
                        <Icon type="plus" />
                        <div class="text--secondary">
                          {i18n.tv('page_client_detail.upload_logo_uri_label', '设置Logo')}
                        </div>
                      </div>
                    )}
                  </div>
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.policy_uri_label', '用户协议')}>
                  <div v-decorator={['policyUri']}>
                    <Space>
                      <Button
                        type="primary"
                        icon="plus"
                        onClick={() => {
                          chooseImage.accept = 'application/pdf';
                          chooseImage.fieldName = 'policyUri';
                          chooseImage.modalVisible = true;
                        }}
                      >
                        {props.form.getFieldValue('policyUri')
                          ? i18n.tv('page_client_detail.policy_uri_update_btn_text', '修改用户协议')
                          : i18n.tv('page_client_detail.policy_uri_add_btn_text', '添加用户协议')}
                      </Button>
                      {!!props.form.getFieldValue('policyUri') && (
                        <Button icon="delete" onClick={() => props.form.setFieldsValue({ policyUri: null })}>
                          {i18n.tv('page_client_detail.policy_uri_remove_btn_text', '移除')}
                        </Button>
                      )}
                    </Space>
                    <div>
                      {!!props.form.getFieldValue('policyUri') && (
                        <a href={props.form.getFieldValue('policyUri')} target="policy_preview">
                          {i18n.tv('page_client_detail.policy_uri_perview_btn_text', '查看用户协议')}
                        </a>
                      )}
                    </div>
                  </div>
                </Form.Item>
              </Form>
            </Modal>
            <Modal
              title={i18n.tv('page_client_detail.choose_file_modal.title', '请选择或上传文件')}
              visible={chooseImage.modalVisible}
              width={932}
              footer={null}
              onCancel={() => {
                chooseImage.fieldName = '';
                chooseImage.modalVisible = false;
              }}
            >
              <MediaList
                selectable
                accept={chooseImage.accept || 'image/*'}
                size="small"
                pageSize={9}
                showSizeChanger={false}
                objectPrefixKey="templates/page_"
                onSelect={(path) => {
                  if (!chooseImage.fieldName) return;
                  props.form.setFieldsValue({ [chooseImage.fieldName]: path });
                  chooseImage.fieldName = '';
                  chooseImage.modalVisible = false;
                }}
              />
            </Modal>
          </div>
        ) : (
          <Card bordered={false} size="small">
            <Result status="error" subTitle={i18n.tv('page_client_detail.not_found', '客户端不存在！')}>
              <template slot="extra">
                <Button key="console" type="primary" onClick={() => router.go(-1)}>
                  {i18n.tv('common.btn_text.go_back', '返回')}
                </Button>
              </template>
            </Result>
          </Card>
        );
      };
    },
  }),
);

import { Button, Descriptions, Input, InputNumber, Modal, Radio, Space, Switch, Tag } from 'antd';
import { useState } from 'react';
import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import { TextForm } from '../../components/common/TextForm';
import { CLIENT_CHILD_OPERATIONS, CLIENTS, CLIENT_DETAIL, CREATE_CLIENT, UPDATE_CLIENT } from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import type { ChildPanelConfig } from '../../types';

const secretTypeOptions = [
  { label: 'SharedSecret', value: 'SharedSecret' },
  { label: 'X509Thumbprint', value: 'X509Thumbprint' },
  { label: 'X509Name', value: 'X509Name' },
  { label: 'X509CertificateBase64', value: 'X509CertificateBase64' },
];

const scopeOptions = [
  { label: 'openid', value: 'openid' },
  { label: 'profile', value: 'profile' },
  { label: 'offline_access', value: 'offline_access' },
];

const applicationTypeOptions = [
  { label: 'web', value: 'web' },
  { label: 'native', value: 'native' },
];

const defaultClientMetadata = {
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
};

function createGuid() {
  if (crypto.randomUUID) return crypto.randomUUID();

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (value) =>
    (Number(value) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(value) / 4)))).toString(16),
  );
}

function getClientValue(client: any, field: keyof typeof defaultClientMetadata) {
  return client[field] ?? defaultClientMetadata[field];
}

function ClientDetailContent({
  client,
  onUpdate,
  t,
  urlRules,
}: {
  client: any;
  onUpdate: (model: Record<string, unknown>) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
  urlRules: Array<{ type: 'url'; message: string }>;
}) {
  const [basicOpen, setBasicOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function updateStatus(checked: boolean) {
    setStatusUpdating(true);
    try {
      await onUpdate({ enabled: checked });
    } finally {
      setStatusUpdating(false);
    }
  }

  function updateField(field: string, value: unknown) {
    return onUpdate({ [field]: value === '' ? null : value });
  }

  function resetField(field: keyof typeof defaultClientMetadata) {
    return updateField(field, defaultClientMetadata[field] ?? null);
  }

  function renderReset(field: keyof typeof defaultClientMetadata) {
    return (
      <Button size="small" type="link" onClick={() => resetField(field)}>
        {t('resource.reset')}
      </Button>
    );
  }

  function renderNumber(
    field: keyof typeof defaultClientMetadata,
    unit: number,
    min: number,
    placeholder: string,
    nullable = false,
  ) {
    const rawValue = getClientValue(client, field) as number | undefined;

    return client.enabled ? (
      <Space>
        <InputNumber
          defaultValue={rawValue ? rawValue / unit : undefined}
          min={min}
          placeholder={placeholder}
          size="small"
          onChange={(value) => updateField(field, value ? Number(value) * unit : nullable ? null : 0)}
        />
        {renderReset(field)}
      </Space>
    ) : (
      rawValue ?? '-'
    );
  }

  function renderText(field: string, label: string) {
    return client.enabled ? (
      <Space>
        <Input
          key={`${field}-${client[field] || ''}`}
          defaultValue={client[field]}
          placeholder={label}
          size="small"
          onBlur={(event) => updateField(field, event.target.value)}
          onPressEnter={(event) => updateField(field, event.currentTarget.value)}
        />
        <Button size="small" type="link" onClick={() => updateField(field, null)}>
          {t('resource.reset')}
        </Button>
      </Space>
    ) : (
      client[field] ?? '-'
    );
  }

  function renderRadio(field: keyof typeof defaultClientMetadata, options: string[]) {
    const value = getClientValue(client, field) as string;

    return client.enabled ? (
      <Space>
        <Radio.Group size="small" value={value} onChange={(event) => updateField(field, event.target.value)}>
          {options.map((option) => (
            <Radio.Button key={option} value={option}>
              {option}
            </Radio.Button>
          ))}
        </Radio.Group>
        {renderReset(field)}
      </Space>
    ) : (
      <Tag color="blue">{value}</Tag>
    );
  }

  function renderSwitch(field: keyof typeof defaultClientMetadata) {
    const value = Boolean(getClientValue(client, field));

    return (
      <Space>
        <Switch checked={value} disabled={!client.enabled} onChange={(checked) => updateField(field, checked)} />
        {client.enabled ? renderReset(field) : null}
      </Space>
    );
  }

  return (
    <>
      <Descriptions
        bordered
        column={1}
        size="small"
        title={
          <Space>
            <span>{t('detail.basic')}</span>
            {client.enabled ? (
              <Button size="small" type="link" onClick={() => setBasicOpen(true)}>
                {t('resource.edit')}
              </Button>
            ) : null}
          </Space>
        }
      >
        <Descriptions.Item label={t('fields.clientName')}>{client.clientName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.clientId')}>{client.clientId}</Descriptions.Item>
        <Descriptions.Item label={t('fields.applicationType')}>
          <Tag color={client.applicationType === 'native' ? 'cyan' : 'green'}>{client.applicationType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.enabled')}>
          <Switch checked={client.enabled} loading={statusUpdating} onChange={updateStatus} />
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.clientUri')}>{client.clientUri || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.initiateLoginUri')}>{client.initiateLoginUri || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.logoUri')}>{client.logoUri || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.policyUri')}>{client.policyUri || '-'}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered column={1} size="small" title={t('detail.authentication')}>
        <Descriptions.Item label={t('fields.defaultMaxAge')}>
          {renderNumber('defaultMaxAge', 60, 0, 'Max age', true)}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.subjectType')}>
          {renderRadio('subjectType', ['public', 'pairwise'])}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.sectorIdentifierUri')}>
          {renderText('sectorIdentifierUri', 'Sector identifier URI')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.jwksUri')}>{renderText('jwksUri', 'JWKs URI')}</Descriptions.Item>
        <Descriptions.Item label={t('fields.requireConsent')}>{renderSwitch('requireConsent')}</Descriptions.Item>
        <Descriptions.Item label={t('fields.requirePkce')}>{renderSwitch('requirePkce')}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered column={1} size="small" title={t('detail.token')}>
        <Descriptions.Item label={t('fields.idTokenLifetime')}>
          {renderNumber('idTokenLifetime', 60, 5, 'ID Token lifetime')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.requireAuthTime')}>{renderSwitch('requireAuthTime')}</Descriptions.Item>
        <Descriptions.Item label={t('fields.accessTokenFormat')}>
          {renderRadio('accessTokenFormat', ['opaque', 'jwt'])}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.accessTokenLifetime')}>
          {renderNumber('accessTokenLifetime', 60, 5, 'Access Token lifetime')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.refreshTokenExpiration')}>
          {renderRadio('refreshTokenExpiration', ['absolute', 'sliding'])}
        </Descriptions.Item>
        {getClientValue(client, 'refreshTokenExpiration') === 'absolute' ? (
          <Descriptions.Item label={t('fields.refreshTokenAbsoluteLifetime')}>
            {renderNumber('refreshTokenAbsoluteLifetime', 86400, 1, 'Refresh Token absolute lifetime')}
          </Descriptions.Item>
        ) : (
          <Descriptions.Item label={t('fields.refreshTokenSlidingLifetime')}>
            {renderNumber('refreshTokenSlidingLifetime', 86400, 1, 'Refresh Token sliding lifetime')}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('fields.authorizationCodeLifetime')}>
          {renderNumber('authorizationCodeLifetime', 60, 5, 'Authorization code lifetime')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.deviceCodeLifetime')}>
          {renderNumber('deviceCodeLifetime', 60, 5, 'Device code lifetime')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.backchannelAuthenticationRequestLifetime')}>
          {renderNumber('backchannelAuthenticationRequestLifetime', 60, 5, 'Backchannel lifetime')}
        </Descriptions.Item>
      </Descriptions>

      <Modal
        destroyOnClose
        footer={null}
        open={basicOpen}
        title={t('detail.basicEdit')}
        onCancel={() => setBasicOpen(false)}
      >
        <TextForm
          fields={[
            { name: 'clientName', label: t('fields.clientName'), defaultValue: client.clientName, required: true },
            {
              name: 'applicationType',
              label: t('fields.applicationType'),
              type: 'select',
              options: applicationTypeOptions,
              defaultValue: client.applicationType,
              required: true,
            },
            { name: 'clientUri', label: t('fields.clientUri'), defaultValue: client.clientUri, rules: urlRules },
            {
              name: 'initiateLoginUri',
              label: t('fields.initiateLoginUri'),
              defaultValue: client.initiateLoginUri,
              rules: urlRules,
            },
            { name: 'logoUri', label: t('fields.logoUri'), defaultValue: client.logoUri, rules: urlRules },
            { name: 'policyUri', label: t('fields.policyUri'), defaultValue: client.policyUri, rules: urlRules },
          ]}
          submitText={t('resource.update')}
          onSubmit={onUpdate}
          onSuccess={() => setBasicOpen(false)}
        />
      </Modal>
    </>
  );
}

export function ClientsPage() {
  const { t } = useI18n();
  const urlRules = [{ type: 'url' as const, message: t('validation.url') }];
  const grantTypeOptions = [
    { label: t('grantType.authorizationCode'), value: 'authorization_code' },
    { label: t('grantType.clientCredentials'), value: 'client_credentials' },
    { label: t('grantType.deviceCode'), value: 'device_code' },
    { label: t('grantType.jwtBearer'), value: 'jwt-bearer' },
    { label: t('grantType.refreshToken'), value: 'refresh_token' },
    { label: t('grantType.saml2Bearer'), value: 'saml2-bearer' },
    { label: t('grantType.tokenExchange'), value: 'token-exchange' },
  ];
  const clientDetailFields = [
    { name: 'clientName', label: t('fields.clientName') },
    { name: 'clientId', label: t('fields.clientId') },
    { name: 'applicationType', label: t('fields.applicationType'), options: applicationTypeOptions },
    { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' as const },
    { name: 'clientUri', label: t('fields.clientUri') },
    { name: 'initiateLoginUri', label: t('fields.initiateLoginUri') },
    { name: 'logoUri', label: t('fields.logoUri') },
    { name: 'policyUri', label: t('fields.policyUri') },
    { name: 'defaultMaxAge', label: t('fields.defaultMaxAge') },
    { name: 'subjectType', label: t('fields.subjectType') },
    { name: 'sectorIdentifierUri', label: t('fields.sectorIdentifierUri') },
    { name: 'jwksUri', label: t('fields.jwksUri') },
    { name: 'requireConsent', label: t('fields.requireConsent'), type: 'checkbox' as const },
    { name: 'requirePkce', label: t('fields.requirePkce'), type: 'checkbox' as const },
    { name: 'idTokenSignedResponseAlg', label: t('fields.idTokenSignedResponseAlg') },
    { name: 'tokenEndpointAuthMethod', label: t('fields.tokenEndpointAuthMethod') },
    { name: 'idTokenLifetime', label: t('fields.idTokenLifetime') },
    { name: 'requireAuthTime', label: t('fields.requireAuthTime'), type: 'checkbox' as const },
    { name: 'accessTokenFormat', label: t('fields.accessTokenFormat') },
    { name: 'accessTokenLifetime', label: t('fields.accessTokenLifetime') },
    { name: 'refreshTokenExpiration', label: t('fields.refreshTokenExpiration') },
    { name: 'refreshTokenAbsoluteLifetime', label: t('fields.refreshTokenAbsoluteLifetime') },
    { name: 'refreshTokenSlidingLifetime', label: t('fields.refreshTokenSlidingLifetime') },
    { name: 'authorizationCodeLifetime', label: t('fields.authorizationCodeLifetime') },
    { name: 'deviceCodeLifetime', label: t('fields.deviceCodeLifetime') },
    { name: 'backchannelAuthenticationRequestLifetime', label: t('fields.backchannelAuthenticationRequestLifetime') },
  ];
  const propertyPresets = [
    {
      group: t('property.basicGroup'),
      children: [
        {
          key: 'primaryColor',
          type: 'hex' as const,
          title: t('property.primaryColor'),
          defaultValue: '#1890ff',
        },
      ],
    },
    {
      group: t('property.authorizationGroup'),
      children: [
        {
          key: 'loginPage.template',
          type: 'string' as const,
          title: t('property.loginPageTemplate'),
          description: t('property.loginPageTemplateDescription'),
        },
        {
          key: 'loginPage.formLableDisplay',
          type: 'boolean' as const,
          title: t('property.loginPageFormLabelDisplay'),
          description: t('property.loginPageFormLabelDisplayDescription'),
          defaultValue: true,
        },
        {
          key: 'loginPage.formValidateTooltip',
          type: 'boolean' as const,
          title: t('property.loginPageFormValidateTooltip'),
          description: t('property.loginPageFormValidateTooltipDescription'),
          defaultValue: false,
        },
        {
          key: 'consentPage.template',
          type: 'string' as const,
          title: t('property.consentPageTemplate'),
          description: t('property.consentPageTemplateDescription'),
        },
        {
          key: 'auth.signoutDisabled',
          type: 'boolean' as const,
          title: t('property.signoutDisabled'),
          defaultValue: false,
        },
      ],
    },
  ];
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      description: t('help.clientClaims'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.claims.query,
      create: CLIENT_CHILD_OPERATIONS.claims.create,
      remove: CLIENT_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'clientClaims.claims',
      fields: [
        { name: 'type', label: t('fields.type'), required: true },
        { name: 'value', label: t('fields.value'), required: true },
      ],
    },
    {
      title: t('panel.corsOrigins'),
      description: t('help.clientCorsOrigins'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.corsOrigins.query,
      create: CLIENT_CHILD_OPERATIONS.corsOrigins.create,
      remove: CLIENT_CHILD_OPERATIONS.corsOrigins.remove,
      itemsPath: 'clientCorsOrigins.corsOrigins',
      fields: [{ name: 'origin', label: t('fields.origin'), required: true, rules: urlRules }],
    },
    {
      title: t('panel.grantTypes'),
      description: t('help.clientGrantTypes'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.grantTypes.query,
      create: CLIENT_CHILD_OPERATIONS.grantTypes.create,
      createMany: CLIENT_CHILD_OPERATIONS.grantTypes.createMany,
      remove: CLIENT_CHILD_OPERATIONS.grantTypes.remove,
      itemsPath: 'clientGrantTypes.grantTypes',
      fields: [
        {
          name: 'grantType',
          label: t('fields.grantType'),
          type: 'tags',
          options: grantTypeOptions,
          required: true,
        },
      ],
    },
    {
      title: t('panel.scopes'),
      description: t('help.clientScopes'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.scopes.query,
      create: CLIENT_CHILD_OPERATIONS.scopes.create,
      createMany: CLIENT_CHILD_OPERATIONS.scopes.createMany,
      remove: CLIENT_CHILD_OPERATIONS.scopes.remove,
      itemsPath: 'clientScopes.scopes',
      fields: [{ name: 'scope', label: t('fields.scope'), type: 'tags', options: scopeOptions, required: true }],
    },
    {
      title: t('panel.redirectUris'),
      description: t('help.clientRedirectUris'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.redirectUris.query,
      create: CLIENT_CHILD_OPERATIONS.redirectUris.create,
      remove: CLIENT_CHILD_OPERATIONS.redirectUris.remove,
      itemsPath: 'clientRedirectUris.redirectUris',
      fields: [{ name: 'redirectUri', label: t('fields.redirectUri'), required: true, rules: urlRules }],
    },
    {
      title: t('panel.postLogoutRedirectUris'),
      description: t('help.clientPostLogoutRedirectUris'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.query,
      create: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.create,
      remove: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.remove,
      itemsPath: 'clientPostLogoutRedirectUris.postLogoutRedirectUris',
      fields: [
        { name: 'postLogoutRedirectUri', label: t('fields.postLogoutRedirectUri'), required: true, rules: urlRules },
      ],
    },
    {
      title: t('panel.secrets'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.secrets.query,
      create: CLIENT_CHILD_OPERATIONS.secrets.create,
      remove: CLIENT_CHILD_OPERATIONS.secrets.remove,
      itemsPath: 'clientSecrets.secrets',
      fields: [
        {
          name: 'type',
          label: t('fields.type'),
          type: 'select',
          defaultValue: 'SharedSecret',
          options: secretTypeOptions,
          required: true,
        },
        { name: 'description', label: t('fields.description'), help: t('help.secretDescription'), required: true },
        { name: 'expiresAt', label: t('fields.expiresAt'), type: 'datetime', required: true },
      ],
    },
    {
      title: t('panel.properties'),
      description: t('help.clientProperties'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.properties.query,
      create: CLIENT_CHILD_OPERATIONS.properties.create,
      remove: CLIENT_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'clientProperties.properties',
      propertyPresets,
      fields: [
        { name: 'key', label: t('fields.key'), required: true },
        { name: 'value', label: t('fields.value'), required: true },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.clients')}
      query={CLIENTS}
      detailQuery={CLIENT_DETAIL}
      createMutation={CREATE_CLIENT}
      updateMutation={UPDATE_CLIENT}
      rowsPath="clients.rows"
      totalPath="clients.total"
      detailPath="client"
      detailVariable="clientId"
      idKey="clientId"
      searchVariable="clientName"
      columns={['clientName', 'applicationType', 'enabled']}
      detailFields={clientDetailFields}
      createFields={[
        {
          name: 'clientId',
          label: t('fields.clientId'),
          generateText: t('resource.generate'),
          generateValue: createGuid,
          required: true,
        },
        { name: 'clientName', label: t('fields.clientName'), required: true },
        {
          name: 'applicationType',
          label: t('fields.applicationType'),
          type: 'select',
          defaultValue: 'web',
          options: applicationTypeOptions,
          required: true,
        },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox', defaultValue: true },
      ]}
      updateFields={[
        { name: 'clientName', label: t('fields.clientName'), required: true },
        {
          name: 'applicationType',
          label: t('fields.applicationType'),
          type: 'select',
          options: applicationTypeOptions,
          required: true,
        },
        { name: 'clientUri', label: t('fields.clientUri'), rules: urlRules },
        { name: 'initiateLoginUri', label: t('fields.initiateLoginUri'), rules: urlRules },
        { name: 'logoUri', label: t('fields.logoUri'), rules: urlRules },
        { name: 'policyUri', label: t('fields.policyUri'), rules: urlRules },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' },
      ]}
      renderDetail={(selected, actions) => (
        <ClientDetailContent client={selected} t={t} urlRules={urlRules} onUpdate={actions.update} />
      )}
    >
      {(selected) => (
        <>
          {panels.map((panel) => (
            <ChildPanel key={panel.title} ownerId={selected?.clientId} config={panel} />
          ))}
        </>
      )}
    </ResourcePage>
  );
}

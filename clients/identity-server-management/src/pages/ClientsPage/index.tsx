import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import { CLIENT_CHILD_OPERATIONS, CLIENTS, CREATE_CLIENT, UPDATE_CLIENT } from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import type { ChildPanelConfig } from '../../types';

export function ClientsPage() {
  const { t } = useI18n();
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.claims.query,
      create: CLIENT_CHILD_OPERATIONS.claims.create,
      remove: CLIENT_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'clientClaims.claims',
      fields: [
        { name: 'type', label: t('fields.type') },
        { name: 'value', label: t('fields.value') },
      ],
    },
    {
      title: t('panel.corsOrigins'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.corsOrigins.query,
      create: CLIENT_CHILD_OPERATIONS.corsOrigins.create,
      remove: CLIENT_CHILD_OPERATIONS.corsOrigins.remove,
      itemsPath: 'clientCorsOrigins.corsOrigins',
      fields: [{ name: 'origin', label: t('fields.origin') }],
    },
    {
      title: t('panel.grantTypes'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.grantTypes.query,
      create: CLIENT_CHILD_OPERATIONS.grantTypes.create,
      remove: CLIENT_CHILD_OPERATIONS.grantTypes.remove,
      itemsPath: 'clientGrantTypes.grantTypes',
      fields: [{ name: 'grantType', label: t('fields.grantType') }],
    },
    {
      title: t('panel.scopes'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.scopes.query,
      create: CLIENT_CHILD_OPERATIONS.scopes.create,
      remove: CLIENT_CHILD_OPERATIONS.scopes.remove,
      itemsPath: 'clientScopes.scopes',
      fields: [{ name: 'scope', label: t('fields.scope') }],
    },
    {
      title: t('panel.redirectUris'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.redirectUris.query,
      create: CLIENT_CHILD_OPERATIONS.redirectUris.create,
      remove: CLIENT_CHILD_OPERATIONS.redirectUris.remove,
      itemsPath: 'clientRedirectUris.redirectUris',
      fields: [{ name: 'redirectUri', label: t('fields.redirectUri') }],
    },
    {
      title: t('panel.postLogoutRedirectUris'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.query,
      create: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.create,
      remove: CLIENT_CHILD_OPERATIONS.postLogoutRedirectUris.remove,
      itemsPath: 'clientPostLogoutRedirectUris.postLogoutRedirectUris',
      fields: [{ name: 'postLogoutRedirectUri', label: t('fields.postLogoutRedirectUri') }],
    },
    {
      title: t('panel.secrets'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.secrets.query,
      create: CLIENT_CHILD_OPERATIONS.secrets.create,
      remove: CLIENT_CHILD_OPERATIONS.secrets.remove,
      itemsPath: 'clientSecrets.secrets',
      fields: [
        { name: 'type', label: t('fields.type'), defaultValue: 'SharedSecret' },
        { name: 'description', label: t('fields.description') },
        { name: 'expiresAt', label: t('fields.expiresAt'), type: 'number' },
      ],
    },
    {
      title: t('panel.properties'),
      ownerVariable: 'clientId',
      query: CLIENT_CHILD_OPERATIONS.properties.query,
      create: CLIENT_CHILD_OPERATIONS.properties.create,
      remove: CLIENT_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'clientProperties.properties',
      fields: [
        { name: 'key', label: t('fields.key') },
        { name: 'value', label: t('fields.value') },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.clients')}
      query={CLIENTS}
      createMutation={CREATE_CLIENT}
      updateMutation={UPDATE_CLIENT}
      rowsPath="clients.rows"
      totalPath="clients.total"
      idKey="clientId"
      searchVariable="clientName"
      columns={['clientId', 'clientName', 'applicationType', 'enabled']}
      createFields={[
        { name: 'clientId', label: t('fields.clientId') },
        { name: 'clientName', label: t('fields.clientName') },
        { name: 'applicationType', label: t('fields.applicationType'), defaultValue: 'web' },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox', defaultValue: true },
      ]}
      updateFields={[
        { name: 'clientName', label: t('fields.clientName') },
        { name: 'clientUri', label: t('fields.clientUri') },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' },
      ]}
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

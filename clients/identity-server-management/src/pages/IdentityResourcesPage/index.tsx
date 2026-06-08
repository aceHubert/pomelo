import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import {
  CREATE_IDENTITY_RESOURCE,
  DELETE_IDENTITY_RESOURCE,
  IDENTITY_CHILD_OPERATIONS,
  IDENTITY_RESOURCES,
  UPDATE_IDENTITY_RESOURCE,
} from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import type { ChildPanelConfig } from '../../types';

export function IdentityResourcesPage() {
  const { t } = useI18n();
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      ownerVariable: 'identityResourceId',
      query: IDENTITY_CHILD_OPERATIONS.claims.query,
      create: IDENTITY_CHILD_OPERATIONS.claims.create,
      remove: IDENTITY_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'identityClaims.claims',
      fields: [{ name: 'type', label: t('fields.type') }],
    },
    {
      title: t('panel.properties'),
      ownerVariable: 'identityResourceId',
      query: IDENTITY_CHILD_OPERATIONS.properties.query,
      create: IDENTITY_CHILD_OPERATIONS.properties.create,
      remove: IDENTITY_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'identityProperties.properties',
      fields: [
        { name: 'key', label: t('fields.key') },
        { name: 'value', label: t('fields.value') },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.identityResources')}
      query={IDENTITY_RESOURCES}
      createMutation={CREATE_IDENTITY_RESOURCE}
      updateMutation={UPDATE_IDENTITY_RESOURCE}
      deleteMutation={DELETE_IDENTITY_RESOURCE}
      rowsPath="identityResources.rows"
      totalPath="identityResources.total"
      idKey="id"
      searchVariable="keyword"
      columns={['id', 'name', 'displayName', 'enabled']}
      createFields={[
        { name: 'name', label: t('fields.name') },
        { name: 'displayName', label: t('fields.displayName') },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox', defaultValue: true },
      ]}
      updateFields={[
        { name: 'displayName', label: t('fields.displayName') },
        { name: 'description', label: t('fields.description') },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' },
      ]}
    >
      {(selected) => (
        <>
          {panels.map((panel) => (
            <ChildPanel key={panel.title} ownerId={selected?.id} config={panel} />
          ))}
        </>
      )}
    </ResourcePage>
  );
}

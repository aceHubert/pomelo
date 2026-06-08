import { Input } from 'antd';
import { useState } from 'react';
import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import {
  API_CHILD_OPERATIONS,
  API_RESOURCES,
  CREATE_API_RESOURCE,
  DELETE_API_RESOURCE,
  UPDATE_API_RESOURCE,
} from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import styles from './index.module.less';
import type { ChildPanelConfig } from '../../types';

export function ApiResourcesPage() {
  const { t } = useI18n();
  const [scopeId, setScopeId] = useState('');
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.claims.query,
      create: API_CHILD_OPERATIONS.claims.create,
      remove: API_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'apiClaims.claims',
      fields: [{ name: 'type', label: t('fields.type') }],
    },
    {
      title: t('panel.scopes'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.scopes.query,
      create: API_CHILD_OPERATIONS.scopes.create,
      remove: API_CHILD_OPERATIONS.scopes.remove,
      itemsPath: 'apiScopes.rows',
      fields: [
        { name: 'name', label: t('fields.name') },
        { name: 'displayName', label: t('fields.displayName') },
      ],
    },
    {
      title: t('panel.secrets'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.secrets.query,
      create: API_CHILD_OPERATIONS.secrets.create,
      remove: API_CHILD_OPERATIONS.secrets.remove,
      itemsPath: 'apiSecrets.secrets',
      fields: [
        { name: 'type', label: t('fields.type'), defaultValue: 'SharedSecret' },
        { name: 'description', label: t('fields.description') },
        { name: 'expiresAt', label: t('fields.expiresAt'), type: 'number' },
      ],
    },
    {
      title: t('panel.properties'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.properties.query,
      create: API_CHILD_OPERATIONS.properties.create,
      remove: API_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'apiProperties.properties',
      fields: [
        { name: 'key', label: t('fields.key') },
        { name: 'value', label: t('fields.value') },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.apiResources')}
      query={API_RESOURCES}
      createMutation={CREATE_API_RESOURCE}
      updateMutation={UPDATE_API_RESOURCE}
      deleteMutation={DELETE_API_RESOURCE}
      rowsPath="apiResources.rows"
      totalPath="apiResources.total"
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
          <section className={styles.scopePanel}>
            <div className={styles.subPanelHeading}>
              <h3>{t('panel.scopeClaims')}</h3>
              <Input
                value={scopeId}
                onChange={(event) => setScopeId(event.target.value)}
                placeholder={t('placeholder.apiScopeId')}
              />
            </div>
            <ChildPanel
              ownerId={scopeId}
              config={{
                title: t('panel.apiScopeClaims'),
                ownerVariable: 'apiScopeId',
                query: API_CHILD_OPERATIONS.scopeClaims.query,
                create: API_CHILD_OPERATIONS.scopeClaims.create,
                remove: API_CHILD_OPERATIONS.scopeClaims.remove,
                itemsPath: 'apiScopeClaims.scopeClaims',
                fields: [{ name: 'type', label: t('fields.type') }],
              }}
            />
          </section>
        </>
      )}
    </ResourcePage>
  );
}

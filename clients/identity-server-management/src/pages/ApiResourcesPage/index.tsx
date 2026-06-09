import { Button, Descriptions, Modal, Space, Switch, Tag } from 'antd';
import { useState } from 'react';
import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import { TextForm } from '../../components/common/TextForm';
import {
  API_CHILD_OPERATIONS,
  API_RESOURCE_DETAIL,
  API_RESOURCES,
  CREATE_API_RESOURCE,
  DELETE_API_RESOURCE,
  UPDATE_API_RESOURCE,
} from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import type { ChildPanelConfig } from '../../types';
import type { FieldConfig } from '../../types';

const secretTypeOptions = [
  { label: 'SharedSecret', value: 'SharedSecret' },
  { label: 'X509Thumbprint', value: 'X509Thumbprint' },
  { label: 'X509Name', value: 'X509Name' },
  { label: 'X509CertificateBase64', value: 'X509CertificateBase64' },
];

function ApiResourceDetailContent({
  resource,
  fields,
  onUpdate,
  t,
}: {
  resource: any;
  fields: FieldConfig[];
  onUpdate: (model: Record<string, unknown>) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const editable = !resource.nonEditable && resource.enabled;

  async function updateStatus(checked: boolean) {
    setStatusUpdating(true);
    try {
      await onUpdate({ enabled: checked });
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <section>
      <Descriptions
        bordered
        column={1}
        size="small"
        title={
          <Space>
            <span>{t('detail.basic')}</span>
            {editable ? (
              <Button size="small" type="link" onClick={() => setEditOpen(true)}>
                {t('resource.edit')}
              </Button>
            ) : null}
          </Space>
        }
      >
        <Descriptions.Item label={t('fields.name')}>{resource.name || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.displayName')}>{resource.displayName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('fields.enabled')}>
          {resource.nonEditable ? (
            <Tag color={resource.enabled ? 'green' : 'red'}>{resource.enabled ? t('status.yes') : t('status.no')}</Tag>
          ) : (
            <Switch checked={resource.enabled} loading={statusUpdating} onChange={updateStatus} />
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.nonEditable')}>
          <Tag color={resource.nonEditable ? 'red' : 'green'}>
            {resource.nonEditable ? t('status.yes') : t('status.no')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.description')}>{resource.description || '-'}</Descriptions.Item>
      </Descriptions>
      <Modal
        destroyOnClose
        footer={null}
        open={editOpen}
        title={t('resource.editInfo')}
        onCancel={() => setEditOpen(false)}
      >
        <TextForm
          fields={fields.map((field) => ({ ...field, defaultValue: resource[field.name] }))}
          submitText={t('resource.update')}
          onSubmit={onUpdate}
          onSuccess={() => setEditOpen(false)}
        />
      </Modal>
    </section>
  );
}

function ApiResourceChildPanels({
  selected,
  panels,
  scopesPanel,
  scopeClaimsPanel,
}: {
  selected: any;
  panels: ChildPanelConfig[];
  scopesPanel: ChildPanelConfig;
  scopeClaimsPanel: ChildPanelConfig;
}) {
  const { t } = useI18n();
  const [selectedScope, setSelectedScope] = useState<any>();
  const selectedScopeLabel = selectedScope
    ? selectedScope.displayName && selectedScope.name
      ? `${selectedScope.displayName} (${selectedScope.name})`
      : selectedScope.name || selectedScope.displayName || selectedScope.id
    : '';

  return (
    <>
      {panels.map((panel) => (
        <ChildPanel key={panel.title} ownerId={selected?.id} config={panel} />
      ))}
      <ChildPanel
        ownerId={selected?.id}
        config={scopesPanel}
        selectedId={selectedScope?.id}
        onSelect={(row) => setSelectedScope(row)}
      />
      {selectedScope ? (
        <ChildPanel
          ownerId={selectedScope.id}
          config={{
            ...scopeClaimsPanel,
            description: scopeClaimsPanel.description
              ? t('help.apiScopeClaimsFor', { scope: selectedScopeLabel })
              : undefined,
          }}
        />
      ) : null}
    </>
  );
}

export function ApiResourcesPage() {
  const { t } = useI18n();
  const resourceNameRules = [
    { pattern: /^[a-zA-Z_]+$/, message: t('validation.resourceName') },
    { max: 50, message: t('validation.maxLength', { max: 50 }) },
  ];
  const detailFields = [
    { name: 'id', label: t('fields.id') },
    { name: 'name', label: t('fields.name') },
    { name: 'displayName', label: t('fields.displayName') },
    { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' as const },
    { name: 'nonEditable', label: t('fields.nonEditable'), type: 'checkbox' as const },
    { name: 'description', label: t('fields.description') },
  ];
  const scopesPanel: ChildPanelConfig = {
    title: t('panel.scopes'),
    description: t('help.apiScopes'),
    ownerVariable: 'apiResourceId',
    query: API_CHILD_OPERATIONS.scopes.query,
    create: API_CHILD_OPERATIONS.scopes.create,
    remove: API_CHILD_OPERATIONS.scopes.remove,
    itemsPath: 'apiScopes.rows',
    fields: [
      { name: 'name', label: t('fields.name'), required: true, rules: resourceNameRules },
      { name: 'displayName', label: t('fields.displayName') },
      { name: 'required', label: t('fields.required'), type: 'checkbox', defaultValue: false },
      {
        name: 'showInDiscoveryDocument',
        label: t('fields.showInDiscoveryDocument'),
        type: 'checkbox',
        defaultValue: true,
      },
      { name: 'description', label: t('fields.description') },
    ],
  };
  const scopeClaimsPanel: ChildPanelConfig = {
    title: t('panel.apiScopeClaims'),
    ownerVariable: 'apiScopeId',
    query: API_CHILD_OPERATIONS.scopeClaims.query,
    create: API_CHILD_OPERATIONS.scopeClaims.create,
    remove: API_CHILD_OPERATIONS.scopeClaims.remove,
    itemsPath: 'apiScopeClaims.scopeClaims',
    description: t('help.apiScopeClaims'),
    fields: [{ name: 'type', label: t('fields.type'), required: true }],
  };
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      description: t('help.apiResourceClaims'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.claims.query,
      create: API_CHILD_OPERATIONS.claims.create,
      remove: API_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'apiClaims.claims',
      fields: [{ name: 'type', label: t('fields.type'), required: true }],
    },
    {
      title: t('panel.secrets'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.secrets.query,
      create: API_CHILD_OPERATIONS.secrets.create,
      remove: API_CHILD_OPERATIONS.secrets.remove,
      itemsPath: 'apiSecrets.secrets',
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
      description: t('help.apiProperties'),
      ownerVariable: 'apiResourceId',
      query: API_CHILD_OPERATIONS.properties.query,
      create: API_CHILD_OPERATIONS.properties.create,
      remove: API_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'apiProperties.properties',
      propertyPresets: [],
      fields: [
        { name: 'key', label: t('fields.key'), required: true },
        { name: 'value', label: t('fields.value'), required: true },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.apiResources')}
      query={API_RESOURCES}
      detailQuery={API_RESOURCE_DETAIL}
      createMutation={CREATE_API_RESOURCE}
      updateMutation={UPDATE_API_RESOURCE}
      deleteMutation={DELETE_API_RESOURCE}
      rowsPath="apiResources.rows"
      totalPath="apiResources.total"
      detailPath="apiResource"
      detailVariable="id"
      idKey="id"
      searchVariable="keyword"
      columns={['id', 'name', 'displayName', 'enabled']}
      detailFields={detailFields}
      createFields={[
        {
          name: 'name',
          label: t('fields.name'),
          help: t('help.resourceName'),
          required: true,
          rules: resourceNameRules,
        },
        { name: 'displayName', label: t('fields.displayName') },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox', defaultValue: true },
      ]}
      updateFields={[
        {
          name: 'name',
          label: t('fields.name'),
          help: t('help.resourceName'),
          required: true,
          rules: resourceNameRules,
        },
        { name: 'displayName', label: t('fields.displayName') },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' },
      ]}
      renderDetail={(selected, actions) => (
        <ApiResourceDetailContent
          resource={selected}
          fields={[
            {
              name: 'name',
              label: t('fields.name'),
              help: t('help.resourceName'),
              required: true,
              rules: resourceNameRules,
            },
            { name: 'displayName', label: t('fields.displayName') },
            { name: 'description', label: t('fields.description'), type: 'textarea' },
          ]}
          t={t}
          onUpdate={actions.update}
        />
      )}
    >
      {(selected) => (
        <ApiResourceChildPanels
          key={selected?.id}
          selected={selected}
          panels={panels}
          scopesPanel={scopesPanel}
          scopeClaimsPanel={scopeClaimsPanel}
        />
      )}
    </ResourcePage>
  );
}

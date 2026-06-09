import { Button, Descriptions, Modal, Space, Switch, Tag } from 'antd';
import { useState } from 'react';
import { ChildPanel } from '../../components/common/ChildPanel';
import { ResourcePage } from '../../components/common/ResourcePage';
import { TextForm } from '../../components/common/TextForm';
import {
  CREATE_IDENTITY_RESOURCE,
  DELETE_IDENTITY_RESOURCE,
  IDENTITY_CHILD_OPERATIONS,
  IDENTITY_RESOURCE_DETAIL,
  IDENTITY_RESOURCES,
  UPDATE_IDENTITY_RESOURCE,
} from '../../apis/operations';
import { useI18n } from '../../services/i18n/i18n';
import type { ChildPanelConfig } from '../../types';
import type { FieldConfig } from '../../types';

function IdentityResourceDetailContent({
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
        <Descriptions.Item label={t('fields.required')}>
          <Tag color={resource.required ? 'green' : 'red'}>{resource.required ? t('status.yes') : t('status.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.showInDiscoveryDocument')}>
          <Tag color={resource.showInDiscoveryDocument ? 'green' : 'red'}>
            {resource.showInDiscoveryDocument ? t('status.yes') : t('status.no')}
          </Tag>
        </Descriptions.Item>
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

export function IdentityResourcesPage() {
  const { t } = useI18n();
  const resourceNameRules = [
    { pattern: /^[a-zA-Z_]+$/, message: t('validation.resourceName') },
    { max: 50, message: t('validation.maxLength', { max: 50 }) },
  ];
  const detailFields = [
    { name: 'id', label: t('fields.id') },
    { name: 'name', label: t('fields.name') },
    { name: 'displayName', label: t('fields.displayName') },
    { name: 'required', label: t('fields.required'), type: 'checkbox' as const },
    { name: 'showInDiscoveryDocument', label: t('fields.showInDiscoveryDocument'), type: 'checkbox' as const },
    { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' as const },
    { name: 'nonEditable', label: t('fields.nonEditable'), type: 'checkbox' as const },
    { name: 'description', label: t('fields.description') },
  ];
  const panels: ChildPanelConfig[] = [
    {
      title: t('panel.claims'),
      description: t('help.identityClaims'),
      ownerVariable: 'identityResourceId',
      query: IDENTITY_CHILD_OPERATIONS.claims.query,
      create: IDENTITY_CHILD_OPERATIONS.claims.create,
      remove: IDENTITY_CHILD_OPERATIONS.claims.remove,
      itemsPath: 'identityClaims.claims',
      fields: [{ name: 'type', label: t('fields.type'), required: true }],
    },
    {
      title: t('panel.properties'),
      description: t('help.identityProperties'),
      ownerVariable: 'identityResourceId',
      query: IDENTITY_CHILD_OPERATIONS.properties.query,
      create: IDENTITY_CHILD_OPERATIONS.properties.create,
      remove: IDENTITY_CHILD_OPERATIONS.properties.remove,
      itemsPath: 'identityProperties.properties',
      propertyPresets: [],
      fields: [
        { name: 'key', label: t('fields.key'), required: true },
        { name: 'value', label: t('fields.value'), required: true },
      ],
    },
  ];

  return (
    <ResourcePage
      title={t('page.identityResources')}
      query={IDENTITY_RESOURCES}
      detailQuery={IDENTITY_RESOURCE_DETAIL}
      createMutation={CREATE_IDENTITY_RESOURCE}
      updateMutation={UPDATE_IDENTITY_RESOURCE}
      deleteMutation={DELETE_IDENTITY_RESOURCE}
      rowsPath="identityResources.rows"
      totalPath="identityResources.total"
      detailPath="identityResource"
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
        { name: 'required', label: t('fields.required'), type: 'checkbox' },
        { name: 'showInDiscoveryDocument', label: t('fields.showInDiscoveryDocument'), type: 'checkbox' },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'enabled', label: t('fields.enabled'), type: 'checkbox' },
      ]}
      renderDetail={(selected, actions) => (
        <IdentityResourceDetailContent
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
            { name: 'required', label: t('fields.required'), type: 'checkbox' },
            { name: 'showInDiscoveryDocument', label: t('fields.showInDiscoveryDocument'), type: 'checkbox' },
            { name: 'description', label: t('fields.description'), type: 'textarea' },
          ]}
          t={t}
          onUpdate={actions.update}
        />
      )}
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

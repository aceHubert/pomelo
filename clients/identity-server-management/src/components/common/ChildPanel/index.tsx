import { Alert, Button, Card, Modal, Space, Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { DataTable } from '../DataTable';
import { PropertyForm } from '../PropertyForm';
import { TextForm } from '../TextForm';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { ChildPanelConfig } from '../../../types';

function getPath(source: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

function getValueOptions(config: ChildPanelConfig) {
  return config.fields.reduce<Record<string, Array<{ label: string; value: string | number | boolean }>>>(
    (options, field) => {
      if (field.options) {
        options[field.name] = field.options;
      }
      return options;
    },
    {},
  );
}

export function ChildPanel({
  ownerId,
  config,
  selectedId,
  onSelect,
}: {
  ownerId?: string | number;
  config: ChildPanelConfig;
  selectedId?: string | number;
  onSelect?: (row: any) => void;
}) {
  const { t } = useI18n();
  const variables = { [config.ownerVariable]: ownerId, offset: 0, limit: 50 };
  const disabled = ownerId === undefined || ownerId === '';
  const { data, loading, refetch } = useQuery(config.query, { variables, skip: disabled });
  const [create] = useMutation(config.create);
  const [createMany] = useMutation(config.createMany || config.create);
  const [remove] = useMutation(config.remove);
  const [createOpen, setCreateOpen] = useState(false);
  const rows = getPath(data, config.itemsPath) || [];
  const valueOptions = getValueOptions(config);

  return (
    <Card
      className={styles.subPanel}
      size="small"
      title={
        <Space>
          <Typography.Text strong>{config.title}</Typography.Text>
          {loading ? <Spin size="small" /> : null}
        </Space>
      }
      extra={
        <Button
          disabled={disabled}
          icon={<PlusOutlined />}
          size="small"
          type="primary"
          onClick={() => setCreateOpen(true)}
        >
          {t('resource.add')}
        </Button>
      }
    >
      {disabled ? (
        <Typography.Text type="secondary">{t('resource.noOwner')}</Typography.Text>
      ) : (
        <>
          <Modal
            destroyOnClose
            footer={null}
            open={createOpen}
            title={`${t('resource.add')} ${config.title}`}
            onCancel={() => setCreateOpen(false)}
          >
            {config.propertyPresets ? (
              <PropertyForm
                presets={config.propertyPresets}
                submitText={t('resource.add')}
                onSubmit={async (model) => {
                  await create({ variables: { [config.ownerVariable]: ownerId, model } });
                  await refetch();
                }}
                onSuccess={() => setCreateOpen(false)}
              />
            ) : (
              <TextForm
                fields={config.fields}
                submitText={t('resource.add')}
                onSubmit={async (model) => {
                  const tagsField = config.fields.find(
                    (field) => field.type === 'tags' && Array.isArray(model[field.name]),
                  );

                  if (config.createMany && tagsField) {
                    const tags = model[tagsField.name] as string[];
                    await createMany({
                      variables: {
                        [config.ownerVariable]: ownerId,
                        model: tags.map((tag) => ({ ...model, [tagsField.name]: tag })),
                      },
                    });
                  } else {
                    await create({ variables: { [config.ownerVariable]: ownerId, model } });
                  }
                  await refetch();
                }}
                onSuccess={() => setCreateOpen(false)}
              />
            )}
          </Modal>
          {config.description ? (
            <Alert banner className={styles.description} message={config.description} showIcon={false} type="warning" />
          ) : null}
          <DataTable
            rows={rows}
            idKey="id"
            selectedId={selectedId}
            columns={rows[0] ? Object.keys(rows[0]).filter((key) => key !== '__typename') : ['id']}
            valueOptions={valueOptions}
            onSelect={onSelect}
            onDelete={async (row) => {
              await remove({ variables: { id: row.id } });
              await refetch();
            }}
          />
        </>
      )}
    </Card>
  );
}

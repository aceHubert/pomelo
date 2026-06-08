import { Card, Space, Spin, Typography } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { DataTable } from '../DataTable';
import { TextForm } from '../TextForm';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { ChildPanelConfig } from '../../../types';

function getPath(source: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

export function ChildPanel({ ownerId, config }: { ownerId?: string | number; config: ChildPanelConfig }) {
  const { t } = useI18n();
  const variables = { [config.ownerVariable]: ownerId, offset: 0, limit: 50 };
  const disabled = ownerId === undefined || ownerId === '';
  const { data, loading, refetch } = useQuery(config.query, { variables, skip: disabled });
  const [create] = useMutation(config.create);
  const [remove] = useMutation(config.remove);
  const rows = getPath(data, config.itemsPath) || [];

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
    >
      {disabled ? (
        <Typography.Text type="secondary">{t('resource.noOwner')}</Typography.Text>
      ) : (
        <>
          <TextForm
            fields={config.fields}
            submitText={t('resource.add')}
            onSubmit={async (model) => {
              await create({ variables: { [config.ownerVariable]: ownerId, model } });
              await refetch();
            }}
          />
          <DataTable
            rows={rows}
            idKey="id"
            columns={rows[0] ? Object.keys(rows[0]).filter((key) => key !== '__typename') : ['id']}
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

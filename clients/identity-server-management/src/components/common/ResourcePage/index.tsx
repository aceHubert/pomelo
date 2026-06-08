import { Button, Col, Input, Row, Space, Typography } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../DataTable';
import { TextForm } from '../TextForm';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { DocumentNode } from '@apollo/client';
import type { FieldConfig } from '../../../types';

function getPath(source: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

export function ResourcePage({
  title,
  query,
  createMutation,
  updateMutation,
  deleteMutation,
  rowsPath,
  totalPath,
  idKey,
  searchVariable,
  createFields,
  updateFields,
  columns,
  children,
}: {
  title: string;
  query: DocumentNode;
  createMutation: DocumentNode;
  updateMutation: DocumentNode;
  deleteMutation?: DocumentNode;
  rowsPath: string;
  totalPath: string;
  idKey: string;
  searchVariable: string;
  createFields: FieldConfig[];
  updateFields: FieldConfig[];
  columns: string[];
  children: (selected: any, refetch: () => Promise<any>) => JSX.Element;
}) {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState('');
  const variables = useMemo(
    () => ({
      [searchVariable]: keyword || undefined,
      keywordField: 'name',
      offset: 0,
      limit: 20,
    }),
    [keyword, searchVariable],
  );
  const { data, loading, refetch } = useQuery(query, { variables });
  const [create] = useMutation(createMutation);
  const [update] = useMutation(updateMutation);
  const [remove] = useMutation(deleteMutation || updateMutation);
  const rows = getPath(data, rowsPath) || [];
  const total = getPath(data, totalPath) || 0;
  const [selectedId, setSelectedId] = useState<string | number | undefined>();
  const selected = rows.find((row: any) => String(row[idKey]) === String(selectedId)) || rows[0];

  useEffect(() => {
    if (!selectedId && rows[0]) setSelectedId(rows[0][idKey]);
  }, [idKey, rows, selectedId]);

  return (
    <Row className={styles.pageGrid} gutter={16}>
      <Col className={styles.pageGridMain} flex="1 1 0">
        <section className={styles.mainPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <Typography.Title level={2}>{title}</Typography.Title>
              <Typography.Text type="secondary">
                {loading ? t('resource.loading') : t('resource.count', { count: total })}
              </Typography.Text>
            </div>
          </div>
          <Space.Compact className={styles.toolbar} block>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t('resource.search')}
            />
            <Button onClick={() => refetch()}>{t('resource.refresh')}</Button>
          </Space.Compact>
          <TextForm
            fields={createFields}
            submitText={t('resource.create')}
            onSubmit={async (model) => {
              await create({ variables: { model } });
              await refetch();
            }}
          />
          <DataTable
            rows={rows}
            selectedId={selected?.[idKey]}
            idKey={idKey}
            columns={columns}
            onSelect={(row) => setSelectedId(row[idKey])}
            onDelete={
              deleteMutation
                ? async (row) => {
                    await remove({ variables: { id: row[idKey] } });
                    await refetch();
                  }
                : undefined
            }
          />
        </section>
      </Col>
      <Col className={styles.pageGridDetail} flex="0 0 min(520px, 42vw)">
        <aside className={styles.detailPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <Typography.Title level={2}>{t('resource.detail')}</Typography.Title>
              <Typography.Text type="secondary">{selected ? selected[idKey] : ''}</Typography.Text>
            </div>
          </div>
          {selected ? (
            <TextForm
              fields={updateFields.map((field) => ({ ...field, defaultValue: selected[field.name] }))}
              submitText={t('resource.update')}
              onSubmit={async (model) => {
                await update({
                  variables:
                    idKey === 'clientId' ? { clientId: selected[idKey], model } : { id: selected[idKey], model },
                });
                await refetch();
              }}
            />
          ) : null}
          {children(selected, refetch)}
        </aside>
      </Col>
    </Row>
  );
}

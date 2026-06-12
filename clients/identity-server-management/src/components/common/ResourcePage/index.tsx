import { Button, Descriptions, Input, Modal, Space, Spin, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { TextForm } from '@/components/common/TextForm';
import { useI18n } from '@/services/i18n/i18n';
import styles from './index.module.less';
import type { DocumentNode } from '@apollo/client';
import type { FieldConfig } from '@/types';

function getPath(source: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

const SEARCH_DEBOUNCE_MS = 300;

function formatDetailValue(field: FieldConfig, value: unknown, t: ReturnType<typeof useI18n>['t']) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (field.type === 'checkbox' || typeof value === 'boolean') {
    return <Tag color={value ? 'green' : 'red'}>{value ? t('status.yes') : t('status.no')}</Tag>;
  }

  const option = field.options?.find((item) => String(item.value) === String(value));
  if (option) {
    return option.label;
  }

  return String(value);
}

export function ResourcePage({
  title,
  query,
  detailQuery,
  createMutation,
  updateMutation,
  deleteMutation,
  rowsPath,
  totalPath,
  detailPath,
  detailVariable,
  idKey,
  searchVariable,
  createFields,
  updateFields,
  detailFields,
  renderDetail,
  columns,
  children,
}: {
  title: string;
  query: DocumentNode;
  detailQuery: DocumentNode;
  createMutation: DocumentNode;
  updateMutation: DocumentNode;
  deleteMutation?: DocumentNode;
  rowsPath: string;
  totalPath: string;
  detailPath: string;
  detailVariable: string;
  idKey: string;
  searchVariable: string;
  createFields: FieldConfig[];
  updateFields?: FieldConfig[];
  detailFields?: FieldConfig[];
  renderDetail?: (
    selected: any,
    actions: {
      update: (model: Record<string, unknown>) => Promise<void>;
      refetch: () => Promise<any>;
      refetchDetail: () => Promise<any>;
    },
  ) => JSX.Element;
  columns: string[];
  children: (selected: any, refetch: () => Promise<any>) => JSX.Element;
}) {
  const { t } = useI18n();
  const composingRef = useRef(false);
  const searchTimerRef = useRef<number>();
  const [searchText, setSearchText] = useState('');
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
  const [createOpen, setCreateOpen] = useState(false);
  const selectedSummary =
    selectedId !== undefined ? rows.find((row: any) => String(row[idKey]) === String(selectedId)) : undefined;
  const {
    data: detailData,
    loading: detailLoading,
    refetch: refetchDetail,
  } = useQuery(detailQuery, {
    variables: { [detailVariable]: selectedId },
    skip: selectedId === undefined,
  });
  const selectedDetail = getPath(detailData, detailPath);
  const selected = selectedDetail || selectedSummary;

  useEffect(() => {
    if (!rows.length) {
      if (selectedId !== undefined) {
        setSelectedId(undefined);
      }
      return;
    }

    if (selectedId === undefined || !rows.some((row: any) => String(row[idKey]) === String(selectedId))) {
      setSelectedId(rows[0][idKey]);
    }
  }, [idKey, rows, selectedId]);

  function scheduleKeywordUpdate(nextKeyword: string) {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      setKeyword(nextKeyword);
      searchTimerRef.current = undefined;
    }, SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    if (!composingRef.current) {
      scheduleKeywordUpdate(searchText);
    }

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText]);

  function refreshWithCurrentSearch() {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = undefined;
    }
    setKeyword(searchText);
    return refetch({
      [searchVariable]: searchText || undefined,
      keywordField: 'name',
      offset: 0,
      limit: 20,
    });
  }

  async function updateSelected(model: Record<string, unknown>) {
    if (!selected) return;

    await update({
      variables: idKey === 'clientId' ? { clientId: selected[idKey], model } : { id: selected[idKey], model },
    });
    await Promise.all([refetch(), refetchDetail()]);
  }

  return (
    <div className={`${styles.pageGrid} ${selected ? '' : styles.pageGridSingle}`}>
      <div className={styles.pageGridMain}>
        <section className={styles.mainPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <Typography.Title level={2}>{title}</Typography.Title>
              <Typography.Text type="secondary">
                {loading ? t('resource.loading') : t('resource.count', { count: total })}
              </Typography.Text>
            </div>
            <Button icon={<PlusOutlined />} color="default" variant="solid" onClick={() => setCreateOpen(true)}>
              {t('resource.create')}
            </Button>
          </div>
          <Space.Compact className={styles.toolbar} block>
            <Input
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onCompositionEnd={(event) => {
                composingRef.current = false;
                const nextSearchText = event.currentTarget.value;
                setSearchText(nextSearchText);
                scheduleKeywordUpdate(nextSearchText);
              }}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              placeholder={t('resource.search')}
            />
            <Button onClick={() => refreshWithCurrentSearch()}>{t('resource.refresh')}</Button>
          </Space.Compact>
          <Modal
            destroyOnClose
            footer={null}
            open={createOpen}
            title={`${t('resource.create')} ${title}`}
            onCancel={() => setCreateOpen(false)}
          >
            <TextForm
              fields={createFields}
              submitText={t('resource.create')}
              onSubmit={async (model) => {
                await create({ variables: { model } });
                await refetch();
              }}
              onSuccess={() => setCreateOpen(false)}
            />
          </Modal>
          <DataTable
            rows={rows}
            selectedId={selectedSummary?.[idKey]}
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
      </div>
      {selected ? (
        <div className={styles.pageGridDetail}>
          <aside className={styles.detailPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <Typography.Title level={2}>{t('resource.detail')}</Typography.Title>
              </div>
            </div>
            {detailLoading && !selectedDetail ? (
              <Spin />
            ) : renderDetail ? (
              <>
                {renderDetail(selected, { update: updateSelected, refetch, refetchDetail })}
                {children(selected, refetch)}
              </>
            ) : (
              <>
                <section className={styles.detailSection}>
                  <Typography.Title level={3}>{t('resource.detailInfo')}</Typography.Title>
                  <Descriptions bordered className={styles.detailDescriptions} column={1} size="small">
                    {(detailFields || []).map((field) => (
                      <Descriptions.Item key={field.name} label={field.label}>
                        {formatDetailValue(field, selected[field.name], t)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </section>
                <section className={styles.detailSection}>
                  <Typography.Title level={3}>{t('resource.editInfo')}</Typography.Title>
                  <TextForm
                    fields={(updateFields || []).map((field) => ({ ...field, defaultValue: selected[field.name] }))}
                    resetOnSuccess={false}
                    submitText={t('resource.update')}
                    onSubmit={updateSelected}
                  />
                </section>
                {children(selected, refetch)}
              </>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

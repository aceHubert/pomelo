import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { ColumnsType } from 'antd/es/table';

function getActionColumnWidth(onSelect?: (row: any) => void, onDelete?: (row: any) => void) {
  if (onSelect && onDelete) return 132;
  if (onSelect || onDelete) return 76;
  return 0;
}

function getDataColumnWidth(column: string) {
  if (column === 'id') return 96;
  if (column === 'enabled') return 96;
  return 144;
}

export function DataTable({
  rows,
  selectedId,
  idKey,
  columns,
  onSelect,
  onDelete,
  valueOptions,
}: {
  rows: any[];
  selectedId?: string | number;
  idKey: string;
  columns: string[];
  onSelect?: (row: any) => void;
  onDelete?: (row: any) => void;
  valueOptions?: Record<string, Array<{ label: string; value: string | number | boolean }>>;
}) {
  const { t } = useI18n();
  const tableRef = useRef<HTMLDivElement>(null);
  const actionWidth = getActionColumnWidth(onSelect, onDelete);
  const scrollX = columns.reduce((width, column) => width + getDataColumnWidth(column), actionWidth);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;

    const syncCompact = () => {
      setCompact(element.getBoundingClientRect().width < scrollX);
    };
    const observer = new ResizeObserver(syncCompact);

    syncCompact();
    observer.observe(element);

    return () => observer.disconnect();
  }, [scrollX]);

  function renderCell(value: unknown, column: string) {
    if (typeof value === 'boolean') {
      return <Tag color={value ? 'success' : 'default'}>{value ? t('status.yes') : t('status.no')}</Tag>;
    }
    const option = valueOptions?.[column]?.find((item) => String(item.value) === String(value));
    if (option) return option.label;

    return String(value ?? '');
  }

  const tableColumns: ColumnsType<any> = columns.map((column) => ({
    title: t(`fields.${column}`, undefined, column),
    dataIndex: column,
    key: column,
    ellipsis: true,
    width: compact ? getDataColumnWidth(column) : undefined,
    render: (value) => renderCell(value, column),
  }));
  if (onSelect || onDelete) {
    tableColumns.push({
      title: t('table.actions'),
      key: 'actions',
      fixed: compact ? 'right' : undefined,
      width: actionWidth,
      render: (_, row) => (
        <Space size={6}>
          {onSelect ? (
            <Button size="small" onClick={() => onSelect(row)}>
              {t('table.select')}
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              cancelText={t('table.cancel')}
              okText={t('table.confirm')}
              title={t('table.deleteConfirm')}
              onConfirm={() => onDelete(row)}
            >
              <Button danger size="small">
                {t('table.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    });
  }

  return (
    <div ref={tableRef} className={styles.tableShell}>
      <Table
        columns={tableColumns}
        dataSource={rows}
        className={styles.table}
        pagination={false}
        rowKey={(row) => String(row[idKey])}
        rowClassName={(row) => (String(row[idKey]) === String(selectedId) ? styles.selected : '')}
        scroll={compact ? { x: scrollX } : undefined}
        size="small"
        tableLayout={compact ? 'fixed' : 'auto'}
      />
    </div>
  );
}

import { Button, Space, Table } from 'antd';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { ColumnsType } from 'antd/es/table';

export function DataTable({
  rows,
  selectedId,
  idKey,
  columns,
  onSelect,
  onDelete,
}: {
  rows: any[];
  selectedId?: string | number;
  idKey: string;
  columns: string[];
  onSelect?: (row: any) => void;
  onDelete?: (row: any) => void;
}) {
  const { t } = useI18n();
  const tableColumns: ColumnsType<any> = columns.map((column) => ({
    title: t(`fields.${column}`, undefined, column),
    dataIndex: column,
    key: column,
    ellipsis: true,
    render: (value) => String(value ?? ''),
  }));

  if (onSelect || onDelete) {
    tableColumns.push({
      title: t('table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 116,
      render: (_, row) => (
        <Space size={6}>
          {onSelect ? (
            <Button size="small" onClick={() => onSelect(row)}>
              {t('table.select')}
            </Button>
          ) : null}
          {onDelete ? (
            <Button danger size="small" onClick={() => onDelete(row)}>
              {t('table.delete')}
            </Button>
          ) : null}
        </Space>
      ),
    });
  }

  return (
    <Table
      columns={tableColumns}
      dataSource={rows}
      className={styles.table}
      pagination={false}
      rowKey={(row) => String(row[idKey])}
      rowClassName={(row) => (String(row[idKey]) === String(selectedId) ? styles.selected : '')}
      size="small"
      tableLayout="fixed"
    />
  );
}

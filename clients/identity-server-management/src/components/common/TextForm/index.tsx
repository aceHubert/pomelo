import { Alert, Button, Checkbox, Form, Input, InputNumber } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { FieldConfig } from '../../../types';

function buildInitialValues(fields: FieldConfig[]) {
  return fields.reduce<Record<string, string | number | boolean>>((values, field) => {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    }
    return values;
  }, {});
}

function normalizeValues(fields: FieldConfig[], values: Record<string, unknown>) {
  return fields.reduce<Record<string, unknown>>((model, field) => {
    const value = values[field.name];
    if (field.type === 'checkbox') {
      model[field.name] = Boolean(value);
      return model;
    }
    if (value !== undefined && value !== null && value !== '') {
      model[field.name] = value;
    }
    return model;
  }, {});
}

export function TextForm({
  fields,
  submitText,
  onSubmit,
}: {
  fields: FieldConfig[];
  submitText: string;
  onSubmit: (model: Record<string, unknown>) => Promise<void>;
}) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialValues = useMemo(() => buildInitialValues(fields), [fields]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  async function submit(values: Record<string, unknown>) {
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(normalizeValues(fields, values));
      form.resetFields();
      form.setFieldsValue(initialValues);
    } catch (err: any) {
      setError(err.message || t('resource.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form className={styles.inlineForm} form={form} initialValues={initialValues} layout="vertical" onFinish={submit}>
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          label={field.label}
          name={field.name}
          valuePropName={field.type === 'checkbox' ? 'checked' : 'value'}
        >
          {field.type === 'checkbox' ? (
            <Checkbox />
          ) : field.type === 'number' ? (
            <InputNumber className={styles.control} placeholder={field.placeholder || field.label} />
          ) : (
            <Input placeholder={field.placeholder || field.label} />
          )}
        </Form.Item>
      ))}
      <Form.Item className={styles.actions}>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitText}
        </Button>
      </Form.Item>
      {error ? (
        <Form.Item className={styles.error}>
          <Alert message={error} type="error" showIcon />
        </Form.Item>
      ) : null}
    </Form>
  );
}

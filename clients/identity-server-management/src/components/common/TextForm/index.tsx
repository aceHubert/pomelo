import { Alert, Button, Checkbox, DatePicker, Form, Input, InputNumber, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/services/i18n/i18n';
import styles from './index.module.less';
import type { FieldConfig } from '@/types';
import type { Rule } from 'antd/es/form';

function buildInitialValues(fields: FieldConfig[]) {
  return fields.reduce<Record<string, unknown>>((values, field) => {
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
    if (field.type === 'datetime') {
      if (value && typeof (value as { valueOf?: unknown }).valueOf === 'function') {
        model[field.name] = Math.floor(Number((value as { valueOf: () => number }).valueOf()) / 1000);
      }
      return model;
    }
    if (field.type === 'tags') {
      if (Array.isArray(value)) {
        const tags = Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
        if (tags.length) {
          model[field.name] = tags;
        }
      }
      return model;
    }
    if (value !== undefined && value !== null && value !== '') {
      model[field.name] = value;
    }
    return model;
  }, {});
}

function getFieldRules(field: FieldConfig, t: ReturnType<typeof useI18n>['t']): Rule[] | undefined {
  const rules = [...(field.rules || [])];

  if (field.required) {
    rules.unshift({
      required: true,
      whitespace: field.type === undefined || field.type === 'text' || field.type === 'textarea',
      message: t('validation.required', { field: field.label }),
    });
  }

  if (field.type === 'datetime') {
    rules.push({
      validator: async (_, value) => {
        if (!value || typeof (value as { valueOf?: unknown }).valueOf !== 'function') {
          return;
        }

        if (Number((value as { valueOf: () => number }).valueOf()) <= Date.now()) {
          throw new Error(t('validation.futureTime', { field: field.label }));
        }
      },
    });
  }

  return rules.length ? rules : undefined;
}

export function TextForm({
  fields,
  resetOnSuccess = true,
  submitText,
  onSubmit,
  onSuccess,
}: {
  fields: FieldConfig[];
  resetOnSuccess?: boolean;
  submitText: string;
  onSubmit: (model: Record<string, unknown>) => Promise<void>;
  onSuccess?: () => void;
}) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});
  const [tagErrors, setTagErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const initialValues = useMemo(() => buildInitialValues(fields), [fields]);

  useEffect(() => {
    const emptyValues = fields.reduce<Record<string, unknown>>((values, field) => {
      values[field.name] = field.type === 'checkbox' ? false : undefined;
      return values;
    }, {});
    form.setFieldsValue({ ...emptyValues, ...initialValues });
    setTagValues(
      fields.reduce<Record<string, string[]>>((values, field) => {
        if (field.type === 'tags' && Array.isArray(initialValues[field.name])) {
          values[field.name] = initialValues[field.name] as string[];
        }
        return values;
      }, {}),
    );
  }, [fields, form, initialValues]);

  async function submit(values: Record<string, unknown>) {
    setError('');
    const nextTagErrors = fields.reduce<Record<string, string>>((errors, field) => {
      if (field.type === 'tags' && field.required && !tagValues[field.name]?.length) {
        errors[field.name] = t('validation.required', { field: field.label });
      }
      return errors;
    }, {});
    setTagErrors(nextTagErrors);

    if (Object.keys(nextTagErrors).length) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(normalizeValues(fields, { ...values, ...tagValues }));
      if (resetOnSuccess) {
        form.resetFields();
        form.setFieldsValue(initialValues);
        setTagValues({});
        setTagErrors({});
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || t('resource.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form className={styles.inlineForm} form={form} initialValues={initialValues} layout="vertical" onFinish={submit}>
      {fields.map((field) =>
        field.type === 'tags' ? (
          <Form.Item
            key={field.name}
            extra={field.help}
            help={tagErrors[field.name]}
            label={field.label}
            validateStatus={tagErrors[field.name] ? 'error' : undefined}
          >
            <Select
              mode="tags"
              className={styles.control}
              options={field.options}
              placeholder={field.placeholder || field.label}
              tokenSeparators={[',', ' ']}
              value={tagValues[field.name] || []}
              onChange={(value) => {
                setTagValues((current) => ({ ...current, [field.name]: value }));
                setTagErrors((current) => ({ ...current, [field.name]: '' }));
              }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            key={field.name}
            className={field.type === 'checkbox' ? styles.checkboxItem : undefined}
            extra={field.help}
            label={field.type === 'checkbox' ? undefined : field.label}
            name={field.name}
            rules={getFieldRules(field, t)}
            {...(field.type === 'checkbox' ? { valuePropName: 'checked' } : {})}
          >
            {field.type === 'checkbox' ? (
              <Checkbox className={styles.checkboxControl}>{field.label}</Checkbox>
            ) : field.type === 'number' ? (
              <InputNumber className={styles.control} placeholder={field.placeholder || field.label} />
            ) : field.type === 'select' ? (
              <Select
                className={styles.control}
                options={field.options}
                placeholder={field.placeholder || field.label}
              />
            ) : field.type === 'datetime' ? (
              <DatePicker showTime className={styles.control} placeholder={field.placeholder || field.label} />
            ) : field.type === 'textarea' ? (
              <Input.TextArea rows={3} className={styles.control} placeholder={field.placeholder || field.label} />
            ) : (
              <Input
                addonAfter={
                  field.generateValue ? (
                    <Button
                      className={styles.addonButton}
                      htmlType="button"
                      type="text"
                      onClick={() => form.setFieldValue(field.name, field.generateValue?.())}
                    >
                      {field.generateText || t('resource.generate')}
                    </Button>
                  ) : undefined
                }
                placeholder={field.placeholder || field.label}
              />
            )}
          </Form.Item>
        ),
      )}
      <Form.Item className={styles.actions}>
        <Button type="primary" htmlType="button" loading={submitting} onClick={() => form.submit()}>
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

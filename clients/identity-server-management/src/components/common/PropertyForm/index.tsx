import { Alert, AutoComplete, Button, ColorPicker, Form, Input, Select, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../services/i18n/i18n';
import styles from './index.module.less';
import type { PropertyPreset, PropertyPresetGroup } from '../../../types';

type PropertyFormValues = {
  key: string;
  value: unknown;
};

function buildPresetMap(groups: PropertyPresetGroup[]) {
  return groups.reduce<Map<string, PropertyPreset>>((map, group) => {
    group.children.forEach((item) => map.set(item.key, item));
    return map;
  }, new Map<string, PropertyPreset>());
}

function buildOptions(groups: PropertyPresetGroup[]) {
  return groups.map((group) => ({
    label: group.group,
    options: group.children.map((item) => ({ value: item.key, label: item.title || item.key })),
  }));
}

function normalizeValue(value: unknown) {
  if (value && typeof (value as { toHexString?: unknown }).toHexString === 'function') {
    return (value as { toHexString: () => string }).toHexString();
  }
  return value;
}

export function PropertyForm({
  presets,
  submitText,
  onSubmit,
  onSuccess,
}: {
  presets: PropertyPresetGroup[];
  submitText: string;
  onSubmit: (model: Record<string, unknown>) => Promise<void>;
  onSuccess?: () => void;
}) {
  const { t } = useI18n();
  const [form] = Form.useForm<PropertyFormValues>();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const presetMap = useMemo(() => buildPresetMap(presets), [presets]);
  const options = useMemo(() => buildOptions(presets), [presets]);
  const key = Form.useWatch('key', form);
  const preset = key ? presetMap.get(key) : undefined;

  useEffect(() => {
    form.setFieldValue('value', preset?.type === 'boolean' ? String(preset.defaultValue) : preset?.defaultValue);
  }, [form, preset]);

  async function submit(values: PropertyFormValues) {
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ key: values.key, value: normalizeValue(values.value) });
      form.resetFields();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || t('resource.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  function renderValueControl() {
    if (preset?.type === 'boolean') {
      return (
        <Select
          className={styles.control}
          options={[
            { label: t('status.yes'), value: 'true' },
            { label: t('status.no'), value: 'false' },
          ]}
          placeholder={t('property.valueSelectPlaceholder', { title: preset.title || t('fields.value') })}
        />
      );
    }

    if (preset?.type === 'hex') {
      return <ColorPicker className={styles.control} showText format="hex" />;
    }

    return <Input placeholder={t('property.valueInputPlaceholder', { title: preset?.title || t('fields.value') })} />;
  }

  return (
    <Form<PropertyFormValues> className={styles.propertyForm} form={form} layout="vertical" onFinish={submit}>
      <Form.Item
        label={t('property.keyLabel')}
        name="key"
        rules={[
          { required: true, whitespace: true, message: t('validation.required', { field: t('property.keyLabel') }) },
        ]}
      >
        <AutoComplete
          className={styles.control}
          options={options}
          placeholder={t('property.keyPlaceholder')}
          onChange={() => {
            if (form.isFieldTouched('value')) {
              form.resetFields(['value']);
            }
          }}
        />
      </Form.Item>
      <Form.Item
        extra={preset?.description}
        label={
          <span>
            {t('property.valueLabel')}
            {preset?.description ? (
              <Tooltip placement="bottomLeft" title={preset.description}>
                <QuestionCircleOutlined className="ml-1" />
              </Tooltip>
            ) : null}
          </span>
        }
        name="value"
        rules={[
          { required: true, message: t('validation.required', { field: preset?.title || t('property.valueLabel') }) },
        ]}
      >
        {renderValueControl()}
      </Form.Item>
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

import { defineComponent, computed } from '@vue/composition-api';
import { default as moment } from 'moment';
import {
  Form,
  AutoComplete,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Tooltip,
  Upload,
  Icon,
} from 'ant-design-vue';
import { ColorInput } from 'antdv-layout-pro';
import { useI18n } from '@/composables';
import { PropertyType } from '../utils/constants';

// Types
import type { WrappedFormUtils, Form as FormProps } from 'ant-design-vue/types/form/form';
import type { Property } from '../utils/constants';

type PropertyFormProps = {
  form: WrappedFormUtils;
  layout: FormProps['layout'];
  presetPrperties: Array<{ group: string; children: Property[] }>;
};

export const PropertyForm = Form.create({})(
  defineComponent({
    name: 'PropertyForm',
    props: {
      layout: { type: String, default: 'inline' },
      presetPrperties: { type: Array, default: () => [] },
    },
    setup(props: PropertyFormProps, { slots }) {
      const i18n = useI18n();

      const presetPropertyKeyMap = computed(() =>
        props.presetPrperties.reduce((prev, { children }) => {
          children.forEach(({ key, ...rest }) => prev.set(key, rest));
          return prev;
        }, new Map<string, Omit<Property, 'key'>>()),
      );

      return () => {
        const renderValueComponent = (key: string) => {
          const property = presetPropertyKeyMap.value.get(key);
          const propertyType = property?.type ?? PropertyType.String;
          const transformedValidator = (rule: any, value: any, callback: any) => {
            if (property?.validator) {
              const result = property.validator(value);
              result === true
                ? callback()
                : callback(
                    !result
                      ? i18n.tv('property_form.value_validator_error', `${property.title || '属性值'}验证失败`, {
                          title: property.title,
                          type: property.type,
                        })
                      : result,
                  );
            }
            callback();
          };

          switch (propertyType) {
            case PropertyType.Number:
            case PropertyType.Integer:
            case PropertyType.Float:
              return (
                <InputNumber
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          type: propertyType,
                          message: i18n.tv(
                            'property_form.value_pattern_invalid',
                            propertyType === PropertyType.Float
                              ? '请输入正确的小数'
                              : propertyType === PropertyType.Integer
                              ? '请输入正确的整数'
                              : '请输入正确的数字',
                            {
                              title: property?.title,
                              type: propertyType,
                            },
                          ),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  min={property?.min}
                  max={property?.max}
                  step={property?.step ?? propertyType === PropertyType.Float ? 0.1 : 1}
                  style="min-width:120px"
                  placeholder={i18n.tv('property_form.value_placeholder', `请输入${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                />
              );
            case PropertyType.Boolean:
            case PropertyType.Enum:
              return (
                <Select
                  v-decorator={[
                    'value',
                    {
                      initialValue:
                        propertyType === PropertyType.Boolean ? String(property?.defaultValue) : property?.defaultValue,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  style="min-width:120px"
                  options={
                    propertyType === PropertyType.Boolean
                      ? [
                          {
                            label: i18n.tv('property_form.boolean_true', '是'),
                            value: 'true',
                          },
                          {
                            label: i18n.tv('property_form.boolean_false', '否'),
                            value: 'false',
                          },
                        ]
                      : property?.enum?.map((item) =>
                          typeof item === 'string' ? { label: item, value: item } : item,
                        ) ?? []
                  }
                  placeholder={i18n.tv('property_form.value_placeholder', `请选择${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                ></Select>
              );
            case PropertyType.Date:
            case PropertyType.DateTime:
              return (
                <DatePicker
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue
                        ? moment.isMoment(property.defaultValue)
                          ? property.defaultValue
                          : moment(
                              property.defaultValue,
                              property.format ?? propertyType === PropertyType.Date
                                ? 'YYYY-MM-DD'
                                : 'YYYY-MM-DD HH:mm:ss',
                            )
                        : undefined,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  inputReadOnly
                  format={property?.format}
                  valueFormat={property?.format}
                  showTime={propertyType === PropertyType.DateTime}
                  defaultPickerValue={
                    property?.defaultPickerValue
                      ? moment.isMoment(property.defaultPickerValue)
                        ? property.defaultPickerValue
                        : moment(
                            property.defaultPickerValue,
                            property?.format ?? propertyType === PropertyType.Date
                              ? 'YYYY-MM-DD'
                              : 'YYYY-MM-DD HH:mm:ss',
                          )
                      : null
                  }
                  placeholder={i18n.tv('property_form.value_placeholder', `请选择${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                />
              );
            case PropertyType.Month:
              return (
                <DatePicker.MonthPicker
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue
                        ? moment.isMoment(property.defaultValue)
                          ? property.defaultValue
                          : moment(property.defaultValue, property.format ?? 'YYYY-MM')
                        : undefined,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  inputReadOnly
                  format={property?.format}
                  valueFormat={property?.format}
                  defaultPickerValue={
                    property?.defaultPickerValue
                      ? moment.isMoment(property.defaultPickerValue)
                        ? property.defaultPickerValue
                        : moment(property.defaultPickerValue, property?.format ?? 'YYYY-MM')
                      : undefined
                  }
                  placeholder={i18n.tv('property_form.value_placeholder', `请选择${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                />
              );
            case PropertyType.Time:
              return (
                <TimePicker
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue
                        ? moment.isMoment(property.defaultValue)
                          ? property.defaultValue
                          : moment(property.defaultValue, property.format ?? 'HH:mm:ss')
                        : undefined,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  inputReadOnly
                  format={property?.format}
                  valueFormat={property?.format}
                  defaultOpenValue={
                    property?.defaultPickerValue
                      ? moment.isMoment(property.defaultPickerValue)
                        ? property.defaultPickerValue
                        : moment(property.defaultPickerValue, property.format ?? 'HH:mm:ss')
                      : undefined
                  }
                  placeholder={i18n.tv('property_form.value_placeholder', `请选择${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                />
              );
            case PropertyType.Image:
            case PropertyType.File:
              return (
                <Input
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  style="width:220px"
                  placeholder={i18n.tv(
                    'property_form.value_placeholder',
                    `请输入${property?.title || '属性值'}或点击按纽上传`,
                    {
                      title: property?.title,
                      type: propertyType,
                    },
                  )}
                  scopedSlots={{
                    addonAfter: () => (
                      // TODO: upload file/image
                      <Upload accept={property?.accept ?? propertyType === PropertyType.Image ? 'image/*' : null}>
                        <Icon type="upload" />
                      </Upload>
                    ),
                  }}
                />
              );
            case PropertyType.Hex:
              return (
                <ColorInput
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          type: propertyType,
                          message: i18n.tv('property_form.value_pattern_invalid', '请输入正确的 hex 色值', {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  disableAlpha
                  disableFields
                  presetColors={['#00B1A2', '#618030', '#E94709', '#FF000F', '#E60012']}
                  attrs={{
                    placeholder: i18n.tv(
                      'property_form.value_placeholder',
                      `请输入/选择${property?.title || '属性值'}`,
                      {
                        title: property?.title,
                        type: propertyType,
                      },
                    ),
                  }}
                />
              );
            default:
              return (
                <Input
                  v-decorator={[
                    'value',
                    {
                      initialValue: property?.defaultValue,
                      validateFirst: true,
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('property_form.value_required', `${property?.title || '属性值'}必填`, {
                            title: property?.title,
                            type: propertyType,
                          }),
                        },
                        {
                          type: propertyType,
                          message: i18n.tv(
                            'property_form.value_pattern_invalid',
                            `请输入正确的${property?.title || '属性值'}`,
                            {
                              title: property?.title,
                              type: propertyType,
                            },
                          ),
                        },
                        {
                          validator: transformedValidator,
                        },
                      ],
                    },
                  ]}
                  minLength={property?.minLen}
                  maxLength={property?.maxLen}
                  style="width:220px"
                  placeholder={i18n.tv('property_form.value_placeholder', `请输入${property?.title || '属性值'}`, {
                    title: property?.title,
                    type: propertyType,
                  })}
                />
              );
          }
        };

        return (
          <Form form={props.form} layout={props.layout}>
            <Form.Item label={i18n.tv('property_form.key_label', '属性名')} class="mb-2">
              <AutoComplete
                v-decorator={[
                  'key',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('property_form.key_required', '请输入属性名'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('property_form.key_placeholder', '请输入/选择属性名')}
                style="width:220px"
                onChange={() => {
                  // 重置 value
                  props.form.isFieldTouched('value') && props.form.resetFields(['value']);
                }}
              >
                <template slot="dataSource">
                  {props.presetPrperties.map((item) => (
                    <Select.OptGroup label={item.group}>
                      {item.children.map((child) => (
                        <Select.Option key={child.key}>{child.title || child.key}</Select.Option>
                      ))}
                    </Select.OptGroup>
                  ))}
                </template>
              </AutoComplete>
            </Form.Item>
            <Form.Item class="mb-2">
              <span slot="label">
                {i18n.tv('property_form.value_label', '值')}
                {presetPropertyKeyMap.value.get(props.form.getFieldValue('key'))?.description && (
                  <Tooltip
                    title={presetPropertyKeyMap.value.get(props.form.getFieldValue('key'))?.description}
                    placement="bottomLeft"
                  >
                    <Icon type="question-circle" class="ml-1 primary--text" />
                  </Tooltip>
                )}
              </span>

              {renderValueComponent(props.form.getFieldValue('key'))}
            </Form.Item>
            {slots.default?.(props.form)}
          </Form>
        );
      };
    },
  }),
);

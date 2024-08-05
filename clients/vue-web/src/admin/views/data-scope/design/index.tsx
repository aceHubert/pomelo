import { debounce } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Button, Card, Dropdown, Form, Input, Menu, Icon } from 'ant-design-vue';
import { getActiveFetch } from '@ace-fetch/vue';
import { warn } from '@ace-util/core';
import { TemplateStatus } from '@ace-pomelo/shared-client';
import { message } from '@/components';
import { useDesignerMixin } from '@/admin/mixins/designer';
import { ClauseForm } from '../components';
import { TemplateType } from '../constants';
import { FieldConfig } from './field.config';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { ClauseValue } from '../components/clause-form';

type DataScopeDesignProps = {
  id?: string;
  form: WrappedFormUtils;
};

export default Form.create({})(
  defineComponent({
    name: 'DataScopeDesign',
    head() {
      return {
        title: this.$tv('page_templates.data_scopes.design.page_title', '数据范围设计') as string,
      };
    },
    props: {
      id: { type: String },
    },
    setup(props: DataScopeDesignProps, { refs }) {
      const router = useRouter();
      const route = useRoute();
      const fetch = getActiveFetch();
      const designerMixin = useDesignerMixin();

      // #region data scopes 新增、修改、查询
      const isAddMode = computed(() => route.name === 'data-scope-add');
      const statusRef = ref<TemplateStatus>();

      watch(
        () => props.id,
        async (id) => {
          if (!isAddMode.value) {
            const template = await designerMixin.getDetail(id!);
            if (template && template.type === TemplateType) {
              props.form.setFieldsValue({
                title: template.title,
              });

              // status
              statusRef.value = template.status;

              // clause
              template.content && (clauseValueRef.value = JSON.parse(template.content));
            } else {
              message.error({
                content: '数据范围不存在',
                onClose: () => {
                  router.replace({ name: 'data-scopes' });
                },
              });
              return;
            }
          }
        },
        { immediate: true },
      );

      const handleSubmit = (status?: TemplateStatus): void => {
        props.form.validateFields({ first: true }, (err: Error[], values: any) => {
          if (err) return;

          (refs.clauseForm as any)?.validate((error: null | Error, value: any): any => {
            if (error) {
              return message.error(`Error: ${error.message}`);
            }
            warn(process.env.NODE_ENV === 'production', 'valid clause: ' + JSON.stringify(value, null, 2));

            const content = JSON.stringify(value);

            if (isAddMode.value) {
              designerMixin
                .create({
                  ...values,
                  content,
                  status: status || TemplateStatus.Draft,
                  type: TemplateType,
                })
                .then(({ id }) => {
                  router.replace({ name: 'data-scope-edit', params: { id: String(id) } }).then(() => {
                    designerMixin.getCategories().then((treeData) => {
                      designerMixin.category.treeData = treeData;
                    });
                  });
                })
                .catch((err) => {
                  message.error(`新建失败，${err.message}`);
                });
            } else {
              designerMixin
                .update(Number(props.id!), {
                  ...values,
                  content,
                  status,
                })
                .then(() => {
                  status && (statusRef.value = status);
                  message.success('修改成功');
                })
                .catch((err) => {
                  message.error(`修改失败，${err.message}`);
                });
            }
          });
        });
      };
      // #endregion

      // #region clause form 编辑
      const getDefaultClauseValue = (): ClauseValue => ({
        clauses: [],
        groups: [],
        maxGroupLevel: 0,
      });
      const clauseValueRef = ref(getDefaultClauseValue());
      const invalidClauseValueRef = ref(getDefaultClauseValue());

      // 字段配置
      const clauseFields = reactive({
        fields: FieldConfig,
        valueCache: void 0 as string | number | undefined, // 缓存是否需要修改数据库
      });

      const getAllowedValues = (fieldName: string) => {
        warn(process.env.NODE_ENV === 'production', fieldName);

        const item = clauseFields.fields.find((item) => item.fieldName === fieldName);
        if (item?.valueSource) {
          if (typeof item.valueSource === 'string') {
            return fetch!.client.get(item.valueSource).then(({ data }) => {
              item.valueSource = data; // 缓存
              return data;
            });
          } else if (typeof item.valueSource === 'function') {
            return item.valueSource(fetch!.client).then((data) => {
              item.valueSource = data; // 缓存
              return data;
            });
          } else if (Array.isArray(item.valueSource)) {
            return item.valueSource;
          }
        }
        return [];
      };

      // #endregion

      return {
        isAddMode,
        status: statusRef,
        clauseValue: clauseValueRef,
        invalidClauseValue: invalidClauseValueRef,
        clauseFields,
        submiting: designerMixin.submitingRef,
        loadCategoryData: designerMixin.loadCategoryData,
        getAllowedValues,
        handleCategorySearch: debounce(designerMixin.handleCategorySearch, 800),
        handleCategoryChange: designerMixin.handleCategoryChange,
        handleSubmit,
      };
    },
    render() {
      return (
        <Card bordered={false}>
          <Form form={this.form} labelCol={{ span: 5 }} wrapperCol={{ span: 12 }}>
            <Form.Item label={this.$tv('page_templates.title_label', '标题')} wrapperCol={{ sm: 12, md: 6 }}>
              <Input
                placeholder={this.$tv('page_templates.title_placeholder', '请输入标题')}
                v-decorator={[
                  'title',
                  {
                    rules: [{ required: true, message: this.$tv('page_templates.title_required', '请输入标题') }],
                  },
                ]}
              />
            </Form.Item>
            <Form.Item
              label={this.$tv('page_templates.data_scopes.design.content_label', '设计')}
              wrapperCol={{ span: 18 }}
              required
            >
              <ClauseForm
                ref="clauseForm"
                vModel={this.clauseValue}
                fields={this.clauseFields.fields}
                getAllowedValues={this.getAllowedValues.bind(this)}
                onChange={(value: any) => (this.invalidClauseValue = value)}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: { offset: 0 }, sm: { offset: 5 }, span: 12 }}>
              {this.isAddMode ? (
                <Button type="primary" loading={this.submiting} onClick={() => this.handleSubmit()}>
                  {this.$tv('common.btn_text.create', '新建')}
                </Button>
              ) : (
                <Dropdown.Button type="primary" disabled={this.submiting} onClick={() => this.handleSubmit()}>
                  {this.$tv('common.btn_text.save', '保存')}
                  <Menu
                    slot="overlay"
                    onClick={({ key: status }: { key: TemplateStatus }) => this.handleSubmit(status)}
                  >
                    <Menu.Item
                      key={
                        this.status === TemplateStatus.Draft
                          ? TemplateStatus.Publish
                          : this.status === TemplateStatus.Publish
                          ? TemplateStatus.Draft
                          : undefined
                      }
                    >
                      {this.status === TemplateStatus.Draft
                        ? this.$tv('page_templates.btn_text.save_and_publish', '保存并发布')
                        : this.status === TemplateStatus.Publish
                        ? this.$tv('page_templates.btn_text.save_to_draft', '保存草稿')
                        : null}
                    </Menu.Item>
                  </Menu>
                  <Icon slot="icon" type="down" />
                </Dropdown.Button>
              )}
            </Form.Item>
          </Form>
        </Card>
      );
    },
  }),
);

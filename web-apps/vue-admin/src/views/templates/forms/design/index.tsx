import { debounce } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { createDesigner, GlobalRegistry, ScreenType } from '@designable/core';
import { transformToTreeNode, transformToSchema } from '@designable/formily-transformer';
import { onFieldInputValueChange } from '@formily/core';
import { observe } from '@formily/reactive';
import {
  Designer,
  // ComponentTreeWidget,
  SettingsPanel,
  ViewToolsWidget,
  StudioPanel,
  CompositePanel,
  Workbench,
  WorkspacePanel,
  // ResourceWidget,
  ToolbarPanel,
  DesignerToolsWidget,
  ViewportPanel,
  OutlineTreeWidget,
  ViewPanel,
  HistoryWidget,
} from '@formily/antdv-designable';
import { SettingsForm } from '@formily/antdv-settings-form';
import { Divider, Collapse, Icon, Form, Input } from 'ant-design-vue';
import { useConfigProvider } from 'antdv-layout-pro/shared';
import { Theme } from 'antdv-layout-pro/types';
import { warn, jsonSerializeReviver, jsonDeserializeReviver } from '@ace-util/core';
import { Modal, message } from '@/components';
import { useFormApi, TemplateStatus } from '@/fetch/graphql';
import { useI18n, useUserManager } from '@/hooks';
import { DesignLayout } from '../../components';
import { useDesignMixin } from '../../mixins/design.mixin';
import { ResourceWidgets, ComponentWidget, PreviewWidget, SchemaEditorWidget } from './widgets';
import classes from './index.module.less';

// Types
import type { TreeNode, ITreeNode } from '@designable/core';
import type { IFormilySchema } from '@designable/formily-transformer';
import type { NewFormTemplateInput, UpdateFormTemplateInput } from '@/fetch/graphql';
import type { ActionStatus, ActionCapability } from '../../components/design-layout/DesignLayout';

const SchemaMobileMetaKey = 'schema.mobile';
const SchemaPcMetaKey = 'schema.pc';
const SubmitActionMetaKey = 'submit.action';
const SubmitSuccessRedirectMetaKey = 'submit.success_redirect';
const SubmitSuccessTipsMetaKey = 'submit.success_tips';

GlobalRegistry.registerDesignerLocales({
  'zh-CN': {
    sources: {
      Inputs: '输入控件',
      Layouts: '布局组件',
      Arrays: '自增组件',
      Displays: '展示组件',
    },
  },
  'en-US': {
    sources: {
      Inputs: 'Inputs',
      Layouts: 'Layouts',
      Arrays: 'Arrays',
      Displays: 'Displays',
    },
  },
});

export default defineComponent({
  name: 'FormDesign',
  layout: 'blank',
  props: {
    id: { type: String },
  },
  head() {
    return {
      title: this.$tv('page_templates.forms.design.page_title', '表单设计') as string,
      link: [
        // 使用默认 prefixCls 以避免与 layout 冲突
        // {
        //   id: 'ant-design-vue@1.7.8',
        //   href: '//www.unpkg.com/ant-design-vue@1.7.8/dist/antd.min.css',
        //   rel: 'stylesheet',
        // },
        // {
        //   id: 'vant@2.12.53',
        //   href: '//www.unpkg.com/vant@2.12.53/lib/index.css',
        //   rel: 'stylesheet',
        // },
      ],
    };
  },
  beforeRouteLeave(to, from, next) {
    if (this.actionStatus.changed) {
      // Tips: Modal.confirm 会在连续后退中失效
      const confirm = window.confirm(
        this.$tv('page_templates.forms.tips.unsaved_confirm', '未保存表单配置将会丢失，是否离开页面？') as string,
      );
      if (confirm) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();
    const configProvider = useConfigProvider();
    const userManager = useUserManager();
    const formApi = useFormApi();
    const designMixin = useDesignMixin();

    GlobalRegistry.setDesignerLanguage(i18n.locale || 'en-US');

    const engine = createDesigner({
      shortcuts: [],
      rootComponentName: 'Form',
      // defaultScreenType: ScreenType.Mobile,
    });

    const treeNodesCache: {
      responsive?: ITreeNode;
      mobile?: {
        id?: number;
        value: ITreeNode;
      };
      pc?: {
        id?: number;
        value: ITreeNode;
      };
    } = {};

    const showCompositePanelRef = ref(true);
    observe(engine.workbench, (changed) => {
      if (changed.type === 'set' && changed.key === 'type') {
        showCompositePanelRef.value = engine.workbench.type === 'DESIGNABLE';
      }
    });

    observe(engine.screen, (changed) => {
      if (changed.type === 'set' && changed.key === 'type') {
        //  切换前保存记录
        const oldTreeNode = engine.getCurrentTree().serialize();
        switch (changed.oldValue) {
          case ScreenType.Mobile:
            treeNodesCache.mobile = {
              ...treeNodesCache.mobile,
              ...{
                value: oldTreeNode,
              },
            };
            break;
          case ScreenType.PC:
            treeNodesCache.pc = {
              ...treeNodesCache.pc,
              ...{
                value: oldTreeNode,
              },
            };
            break;
          default:
            treeNodesCache.responsive = oldTreeNode;
            break;
        }

        // 切换
        let newTreeNode: ITreeNode | undefined;
        switch (changed.value) {
          case ScreenType.Mobile:
            newTreeNode = treeNodesCache.mobile?.value;
            break;
          case ScreenType.PC:
            newTreeNode = treeNodesCache.pc?.value;
            break;
          default:
            newTreeNode = treeNodesCache.responsive;
            break;
        }

        engine.setCurrentTree(newTreeNode || transformToTreeNode({}));
        engine.workbench.currentWorkspace.history.clear();
        engine.workbench.currentWorkspace.operation.hover.clear();
        engine.workbench.currentWorkspace.operation.selection.select(engine.getCurrentTree());
      }
    });

    // #region data scopes 新增、修改、查询
    const isAddMode = computed(() => route.name === 'form-add');
    const siderCollapsedRef = ref(true);
    const titleRef = ref('');
    const statusRef = ref<TemplateStatus>();
    const submitConfig = reactive<{
      action: { id?: number; value: string; changed?: boolean };
      successRedirect: { id?: number; value: string; changed?: boolean };
      successTips: { id?: number; value: string; changed?: boolean };
    }>({ action: { value: '' }, successRedirect: { value: '' }, successTips: { value: '' } });

    const actionStatus = reactive<Required<ActionStatus>>({
      changed: false,
      processing: false,
      updating: false,
      publishing: false,
      savingToDarft: false,
      submitingReview: false,
      approvingReview: false,
      rejectingReview: false,
      disabledActions: false,
    });

    const actionCapability = reactive<Required<ActionCapability>>({
      operate: false,
      publish: false,
    });

    const isSelfContentRef = ref(false);

    const getFormDetail = async (id: string) => {
      const { form } = await formApi.get({
        variables: {
          id,
          metaKeys: [
            SchemaMobileMetaKey,
            SchemaPcMetaKey,
            SubmitActionMetaKey,
            SubmitSuccessRedirectMetaKey,
            SubmitSuccessTipsMetaKey,
          ],
        },
        catchError: true,
        loading: true,
      });

      if (form) {
        const { title, schema, status } = form;

        // edit model
        titleRef.value = title;
        treeNodesCache.responsive = transformToTreeNode(JSON.parse(schema, jsonDeserializeReviver()));
        // 设置当前设计器的值
        engine.screen.type === ScreenType.Responsive && engine.setCurrentTree(treeNodesCache.responsive);

        // status
        statusRef.value = status;

        // platform
        let mobileMeta: { id: number; value: string } | undefined, pcMeta: { id: number; value: string } | undefined;
        if ((mobileMeta = form.metas.find(({ key }) => key === SchemaMobileMetaKey))) {
          treeNodesCache.mobile = {
            id: mobileMeta.id,
            value: transformToTreeNode(JSON.parse(mobileMeta.value, jsonDeserializeReviver())),
          };
          // 设置当前设计器的值
          engine.screen.type === ScreenType.Mobile && engine.setCurrentTree(treeNodesCache.mobile.value);
        }
        if ((pcMeta = form.metas.find(({ key }) => key === SchemaPcMetaKey))) {
          treeNodesCache.pc = {
            id: pcMeta.id,
            value: transformToTreeNode(JSON.parse(pcMeta.value, jsonDeserializeReviver())),
          };
          // 设置当前设计器的值
          engine.screen.type === ScreenType.PC && engine.setCurrentTree(treeNodesCache.pc.value);
        }

        // submit config
        let submitActionMeta: { id: number; value: string } | undefined,
          submitSuccessRedirectMeta: { id: number; value: string } | undefined,
          submitSuccessTipsMeta: { id: number; value: string } | undefined;
        if ((submitActionMeta = form.metas.find(({ key }) => key === SubmitActionMetaKey))) {
          submitConfig.action = submitActionMeta;
        }
        if ((submitSuccessRedirectMeta = form.metas.find(({ key }) => key === SubmitSuccessRedirectMetaKey))) {
          submitConfig.successRedirect = submitSuccessRedirectMeta;
        }
        if ((submitSuccessTipsMeta = form.metas.find(({ key }) => key === SubmitSuccessTipsMetaKey))) {
          submitConfig.successTips = submitSuccessTipsMeta;
        }

        engine.workbench.currentWorkspace.history.clear();
        // treenode changed
        engine.subscribeWith(
          [
            'append:node',
            'insert:after',
            'insert:before',
            'insert:children',
            'drop:node',
            'prepend:node',
            'remove:node',
            'update:children',
            'wrap:node',
            'update:node:props',
            'history:goto',
            'history:undo',
            'history:redo',
          ],
          (payload) => {
            warn(process.env.NODE_ENV === 'production', payload.type);
            actionStatus.changed = true;
          },
        );
      } else {
        message.error({
          content: '表单不存在',
          onClose: () => {
            router.replace({ name: 'forms' });
          },
        });
      }
      return form;
    };

    watch(
      () => props.id,
      async (id) => {
        const user = await userManager.getUser();
        if (!isAddMode.value) {
          const form = await getFormDetail(id!);
          if (form) {
            // TODO: 设置条件管理员权限
            if (user!.profile.role?.includes('isp.admin')) {
              actionCapability.operate = true;
              actionCapability.publish = true;
            } else {
              // 只能操作自己的
              if (user?.profile.sub === form.author) {
                actionCapability.operate = true;
              }
            }

            // 自己不参与 review
            isSelfContentRef.value = user?.profile.sub === form.author;
          }
        } else {
          actionCapability.operate = true;
          // TODO: 设置条件管理员权限
          if (user!.profile.role?.includes('isp.admin')) {
            actionCapability.publish = true;
          }
        }
      },
      { immediate: true },
    );

    // meta 新建后更新 id 至当前 instance 用于下次更新
    const setMetaValues = (metas: Array<{ id: number; key: string; value: string }>) => {
      metas.forEach(({ id, key, value }) => {
        if (key === SchemaMobileMetaKey) {
          treeNodesCache.mobile = {
            id,
            value: treeNodesCache.mobile?.value || transformToTreeNode(JSON.parse(value, jsonDeserializeReviver())),
          };
        } else if (key === SchemaPcMetaKey) {
          treeNodesCache.pc = {
            id,
            value: treeNodesCache.pc?.value || transformToTreeNode(JSON.parse(value, jsonDeserializeReviver())),
          };
        } else if (key === SubmitActionMetaKey) {
          submitConfig.action = { id, value };
        } else if (key === SubmitSuccessRedirectMetaKey) {
          submitConfig.successRedirect = { id, value };
        } else if (key === SubmitSuccessTipsMetaKey) {
          submitConfig.successTips = { id, value };
        }
      });
    };

    const createForm = (input: NewFormTemplateInput) => {
      return formApi
        .create({
          variables: {
            newFormTemplate: input,
          },
          catchError: true,
          loading: () => {
            actionStatus.processing = true;
            return () => {
              actionStatus.processing = false;
            };
          },
        })
        .then(({ form: { id, schema, metas } }) => {
          // 页面不会刷新，需要更新新建的值用于编辑
          input.status && (statusRef.value = input.status);
          !treeNodesCache.responsive &&
            (treeNodesCache.responsive = transformToTreeNode(JSON.parse(schema, jsonDeserializeReviver())));
          actionStatus.changed = false;
          setMetaValues(metas);
          router.replace({ name: 'form-edit', params: { id: String(id) } }).then(() => {
            designMixin.getCategories().then((treeData) => {
              designMixin.category.treeData = treeData;
            });
          });
        })
        .catch((err) => {
          message.error(`新建失败，${err.message}`);
        });
    };

    const updateForm = (
      input: UpdateFormTemplateInput,
      metas?: Array<{ id?: number; metaKey: string; metaValue: string }>,
    ) => {
      actionStatus.processing = true;
      return Promise.all([
        formApi.update({
          variables: {
            id: props.id!,
            updateForm: input,
          },
        }),
        metas?.map(({ id, metaKey, metaValue }) =>
          id
            ? designMixin.updateMeta({
                id,
                metaValue,
              })
            : designMixin
                .createMeta({
                  templateId: Number(props.id!),
                  metaKey,
                  metaValue,
                })
                .then(({ meta }) => {
                  // 新建更新到缓存
                  setMetaValues([meta]);
                }),
        ),
      ])
        .then(() => {
          input.status && (statusRef.value = input.status);
          actionStatus.changed = false;
        })
        .catch((err) => {
          message.error(`修改失败，${err.message}`);
        })
        .finally(() => {
          actionStatus.processing = false;
        });
    };

    const onSubmit = async (status?: TemplateStatus) => {
      if (!titleRef.value.trim()) {
        message.error(i18n.tv('page_templates.title_required', '标题必填！') as string);
        siderCollapsedRef.value = false;
        return;
      }

      let responsiveSchema: IFormilySchema,
        mobileSchema: IFormilySchema | undefined,
        pcSchema: IFormilySchema | undefined;
      switch (engine.screen.type) {
        case ScreenType.Mobile:
          mobileSchema = transformToSchema(engine.getCurrentTree());
          pcSchema = treeNodesCache.pc ? transformToSchema(treeNodesCache.pc.value) : void 0;
          responsiveSchema = transformToSchema(treeNodesCache.responsive || {});
          break;
        case ScreenType.PC:
          mobileSchema = treeNodesCache.mobile ? transformToSchema(treeNodesCache.mobile.value) : void 0;
          pcSchema = transformToSchema(engine.getCurrentTree());
          responsiveSchema = transformToSchema(treeNodesCache.responsive || {});
          break;
        default:
          mobileSchema = treeNodesCache.mobile ? transformToSchema(treeNodesCache.mobile.value) : void 0;
          pcSchema = treeNodesCache.pc ? transformToSchema(treeNodesCache.pc.value) : void 0;
          responsiveSchema = transformToSchema(engine.getCurrentTree());
          break;
      }

      // schema metas
      const schemaMetas = [
        mobileSchema && {
          id: treeNodesCache.mobile?.id,
          metaKey: SchemaMobileMetaKey,
          metaValue: JSON.stringify(mobileSchema, jsonSerializeReviver),
        },
        pcSchema && {
          id: treeNodesCache.pc?.id,
          metaKey: SchemaPcMetaKey,
          metaValue: JSON.stringify(pcSchema, jsonSerializeReviver),
        },
      ];

      // submit config metas
      const submitMetas = [
        submitConfig.action.changed &&
          submitConfig.action.value && {
            id: submitConfig.action.id,
            metaKey: SubmitActionMetaKey,
            metaValue: submitConfig.action.value,
          },
        submitConfig.successRedirect.changed &&
          submitConfig.successRedirect.value && {
            id: submitConfig.successRedirect.id,
            metaKey: SubmitSuccessRedirectMetaKey,
            metaValue: submitConfig.successRedirect.value,
          },
        submitConfig.successTips.changed &&
          submitConfig.successTips.value && {
            id: submitConfig.successTips.id,
            metaKey: SubmitSuccessTipsMetaKey,
            metaValue: submitConfig.successTips.value,
          },
      ];

      if (isAddMode.value) {
        await createForm({
          title: titleRef.value,
          schema: JSON.stringify(responsiveSchema, jsonSerializeReviver),
          status: status || TemplateStatus.Draft,
          metas: [...schemaMetas, ...submitMetas].filter(Boolean) as Array<{ metaKey: string; metaValue: string }>,
        });
      } else {
        await updateForm(
          { title: titleRef.value, schema: JSON.stringify(responsiveSchema), status },
          [...schemaMetas, ...submitMetas].filter(Boolean) as Array<{
            id?: number;
            metaKey: string;
            metaValue: string;
          }>,
        );
      }
    };

    // 更新，修改post 但不会修改状态
    const handleUpdate = () => {
      actionStatus.updating = true;
      onSubmit().finally(() => {
        actionStatus.updating = false;
      });
    };

    // 保存到草稿，修改post 并将状态修改为draft （当 status 是 private 时，不改变状态）
    const handleSaveToDraft = () => {
      actionStatus.savingToDarft = true;
      const status = statusRef.value === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Draft;
      onSubmit(status).finally(() => {
        actionStatus.savingToDarft = false;
      });
    };

    // 从发布状态（包括 private）切换到草稿状态，修改post 并将状态修改为draft
    // 当 status 是 private 时，强制修改成 draft, 显示将会变为public
    const handleSwitchToDraft = () => {
      Modal.confirm({
        content: i18n.tv('page_templates.forms.tips.unpublishe_confirm', '确认是否将已发布表单配置放入到草稿箱？'),
        okText: i18n.tv('common.btn_text.yes', 'Yes') as string,
        cancelText: i18n.tv('common.btn_text.no', 'No') as string,
        onOk: () => {
          actionStatus.savingToDarft = true;
          const status = TemplateStatus.Draft;
          onSubmit(status).finally(() => {
            actionStatus.savingToDarft = false;
          });
        },
      });
    };

    // 发布，修改post 并将状态修改为 publish（当 status 是 private 时，不改变状态）
    const handelPublish = () => {
      actionStatus.publishing = true;
      const status = statusRef.value === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Publish;
      onSubmit(status).finally(() => {
        actionStatus.publishing = false;
      });
    };

    // 私有发布，修改post 并将状态修改为 Private
    const handleMakePrivate = () => {
      const status = TemplateStatus.Private;
      onSubmit(status);
    };

    // 提交审核，修改post 并将状态修改为 Pending
    const handleSubmitReview = () => {
      actionStatus.submitingReview = true;
      const status = TemplateStatus.Pending;
      onSubmit(status).finally(() => {
        actionStatus.submitingReview = false;
      });
    };

    // 通过提交审核
    const handleApproveReview = () => {
      actionStatus.approvingReview = true;
      const status = TemplateStatus.Publish;
      onSubmit(status).finally(() => {
        actionStatus.approvingReview = false;
      });
    };

    // 拒绝提交审核
    const handleRejectReview = () => {
      // TODO: 设置原因
    };
    // #endregion

    return {
      engine,
      theme: configProvider.theme,
      treeNodesCache,
      actionStatus,
      actionCapability,
      isSelfContent: isSelfContentRef,
      isAddMode,
      siderCollapsed: siderCollapsedRef,
      showCompositePanel: showCompositePanelRef,
      title: titleRef,
      status: statusRef,
      submitConfig,
      category: designMixin.category,
      submiting: designMixin.submitingRef,
      loadCategoryData: designMixin.loadCategoryData,
      handleCategoryChange: designMixin.handleCategoryChange,
      handleCategorySearch: debounce(designMixin.handleCategorySearch, 800),
      handleUploadRequest: designMixin.getCustomUploadRequest('templates/form_'),
      handleUpdate,
      handelPublish,
      handleMakePrivate,
      handleSaveToDraft,
      handleSwitchToDraft,
      handleSubmitReview,
      handleApproveReview,
      handleRejectReview,
    };
  },
  render() {
    return (
      <DesignLayout
        status={this.status}
        actionStatus={this.actionStatus}
        actionCapability={this.actionCapability}
        isSelfContent={this.isSelfContent}
        siderDrawerMode="always"
        siderCollapsed={this.siderCollapsed}
        siderTitle={this.$tv('page_templates.forms.design.sider_title', '表单设置') as string}
        {...{
          scopedSlots: {
            siderContent: () => (
              <Form labelAlign="left" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={this.$tv('page_templates.title_label', '标题')} class="px-3 mb-0">
                  <Input
                    placeholder={this.$tv('page_templates.title_placeholder', '请输入标题')}
                    value={this.title}
                    onInput={(e: any) => {
                      this.title = e.target.value;
                      this.actionStatus.changed = true;
                    }}
                  />
                </Form.Item>

                <Divider class="mt-4 mb-0" />
                <Collapse
                  class="shades transparent"
                  bordered={false}
                  activeKey="statusAndVisibility"
                  expand-icon-position="right"
                >
                  <Collapse.Panel header={this.$tv('page_templates.forms.design.submit_config_label', '请求配置')}>
                    <Form.Item
                      label={this.$tv('page_templates.forms.design.submit_action_label', '请求地址')}
                      class="mb-0"
                    >
                      <Input
                        size="small"
                        placeholder={this.$tv(
                          'page_templates.forms.design.submit_action_placeholder',
                          '请输入请求地址',
                        )}
                        value={this.submitConfig.action.value}
                        onInput={(e: any) => {
                          this.submitConfig.action.value = e.target.value;
                          this.submitConfig.action.changed = true;
                          this.actionStatus.changed = true;
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label={this.$tv('page_templates.forms.design.submit_success_redirect_label', '成功跳转地址')}
                      class="mb-0"
                    >
                      <Input
                        placeholder={this.$tv(
                          'page_templates.forms.design.submit_success_redirect_placeholder',
                          '请输入请求成功跳转地址',
                        )}
                        value={this.submitConfig.successRedirect.value}
                        onInput={(e: any) => {
                          this.submitConfig.successRedirect.value = e.target.value;
                          this.submitConfig.successRedirect.changed = true;
                          this.actionStatus.changed = true;
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label={this.$tv('page_templates.forms.design.submit_success_tips_label', '成功提示文案')}
                      class="mb-0"
                    >
                      <Input
                        placeholder={this.$tv(
                          'page_templates.forms.design.submit_success_tips_placeholder',
                          '请输入请求成功提示文案',
                        )}
                        value={this.submitConfig.successTips.value}
                        onInput={(e: any) => {
                          this.submitConfig.successTips.value = e.target.value;
                          this.submitConfig.successTips.changed = true;
                          this.actionStatus.changed = true;
                        }}
                      />
                    </Form.Item>
                  </Collapse.Panel>
                </Collapse>
              </Form>
            ),
          },
          on: {
            update: () => this.handleUpdate(),
            publish: () => this.handelPublish(),
            saveToDraft: () => this.handleSaveToDraft(),
            switchToDraft: () => this.handleSwitchToDraft(),
            submitReview: () => this.handleSubmitReview(),
            approveReview: () => this.handleApproveReview(),
            rejectReview: () => this.handleRejectReview(),
          },
        }}
      >
        <Designer
          engine={this.engine}
          theme={this.theme === Theme.Dark ? 'dark' : 'light'}
          class={classes.schemaDesigner}
        >
          <Workbench>
            <StudioPanel>
              <CompositePanel>
                <CompositePanel.Item title="panels.Component" icon="Component">
                  <ResourceWidgets />
                </CompositePanel.Item>
                <CompositePanel.Item title="panels.OutlinedTree" icon="Outline">
                  <OutlineTreeWidget />
                </CompositePanel.Item>
                <CompositePanel.Item title="panels.History" icon="History">
                  <HistoryWidget />
                </CompositePanel.Item>
              </CompositePanel>
              <WorkspacePanel>
                <ToolbarPanel>
                  <DesignerToolsWidget></DesignerToolsWidget>
                  <ViewToolsWidget use={['DESIGNABLE', 'JSONTREE', 'PREVIEW']} />
                </ToolbarPanel>
                <ViewportPanel>
                  <ViewPanel type="DESIGNABLE">
                    <ComponentWidget />
                  </ViewPanel>
                  <ViewPanel
                    type="JSONTREE"
                    scrollable={false}
                    {...{
                      scopedSlots: {
                        default: (tree: TreeNode, onChange: (tree: ITreeNode) => void) => {
                          return <SchemaEditorWidget tree={tree} onChange={onChange}></SchemaEditorWidget>;
                        },
                      },
                    }}
                  ></ViewPanel>
                  <ViewPanel
                    type="PREVIEW"
                    scrollable={false}
                    {...{
                      scopedSlots: {
                        default: (tree: TreeNode) => <PreviewWidget tree={tree}></PreviewWidget>,
                      },
                    }}
                  ></ViewPanel>
                </ViewportPanel>
              </WorkspacePanel>
              <SettingsPanel
                title="panels.PropertySettings"
                extra={<Icon type="setting" onClick={() => (this.formSettingVisable = !this.formSettingVisable)} />}
              >
                <SettingsForm
                  uploadMethod="PUT"
                  uploadCustomRequest={(options: any) => this.handleUploadRequest(options)}
                  headers={{}}
                  effects={() => {
                    onFieldInputValueChange('*', (field) => {
                      field.valid && (this.actionStatus.changed = true);
                    });
                  }}
                ></SettingsForm>
              </SettingsPanel>
            </StudioPanel>
          </Workbench>
        </Designer>
      </DesignLayout>
    );
  },
});

import { defineComponent, ref, reactive, computed, watch, toRef } from '@vue/composition-api';
import { useRouter } from 'vue2-helpers/vue-router';
import { createDesigner, GlobalRegistry } from '@designable/core';
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
import { Button, Checkbox, Radio, Divider, Collapse, Icon, Form, Input, Space } from 'ant-design-vue';
import { useConfigProvider, expose } from 'antdv-layout-pro/shared';
import { Theme } from 'antdv-layout-pro/types';
import {
  UserCapability,
  OptionPresetKeys,
  getFrameworkSchema,
  toFrameworkContent,
  type SchemaFramework,
} from '@ace-pomelo/shared/client';
import { trailingSlash, equals, warn } from '@ace-util/core';
import { Modal, message } from '@/components';
import { useTemplateApi, useFormApi, TemplateStatus, FormMetaPresetKeys } from '@/fetch/apis';
import { useI18n, useUserManager, useOptions } from '@/composables';
import { useLocationMixin } from '@/mixins';
import { safeJSONParse } from '@/utils';
import { useUserMixin, useDesignerMixin, useFormilyMixin } from '@/admin/mixins';
import IconLinkExternal from '@admin/assets/icons/link-external.svg?inline';
import { MediaList } from '../../media/components';
import { DesignLayout } from '../../post/components';
import { ResourceWidgets, ComponentWidget, PreviewWidget, SchemaEditorWidget } from './widgets';
import classes from './index.module.less';

// Types
import type { TreeNode, ITreeNode } from '@designable/core';
import type { FormTemplateModel } from '@/fetch/apis';
import type { ActionStatus, ActionCapability } from '../../post/components/design-layout/DesignLayout';

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

enum Settings {
  FixedLink = 'fixedLink',
  FeatureImage = 'featureImage',
}

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
        //   href: '//unpkg.com/ant-design-vue@1.7.8/dist/antd.min.css',
        //   rel: 'stylesheet',
        // },
        // {
        //   id: 'vant@2.12.53',
        //   href: '//unpkg.com/vant@2.12.53/lib/index.css',
        //   rel: 'stylesheet',
        // },
      ],
    };
  },
  beforeRouteLeave(to, from, next) {
    const unsaved = this.unsavedContent as boolean;
    if (unsaved) {
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
    const i18n = useI18n();
    const configProvider = useConfigProvider();
    const userManager = useUserManager();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const userMixin = useUserMixin();
    const designerMixin = useDesignerMixin();
    const locationMixin = useLocationMixin();
    const templateApi = useTemplateApi();
    const formApi = useFormApi();

    GlobalRegistry.setDesignerLanguage(i18n.locale || 'en-US');

    const engine = createDesigner({
      shortcuts: [],
      rootComponentName: 'Form',
      // defaultScreenType: ScreenType.Mobile,
    });

    const formilyMixin = useFormilyMixin(engine);

    // #region data scopes 新增、修改、查询
    const siderCollapsedRef = ref(true);

    const schemaFrameworkOptions = computed(() => [{ label: 'Formily', value: 'FORMILYJS' }]);
    const schemaFrameworkRef = ref<Exclude<SchemaFramework, 'HTML'>>(
      schemaFrameworkOptions.value[0].value as SchemaFramework,
    );

    const settingsDisplayOptions = computed(() => [
      { label: i18n.tv('page_templates.fixed_link_label', '固定链接'), value: Settings.FixedLink },
      { label: i18n.tv('page_templates.feature_image_label', '特色图片'), value: Settings.FeatureImage },
    ]);
    const settingsDisplayRef = ref<Settings[]>(settingsDisplayOptions.value.map(({ value }) => value));

    const formData = reactive<
      Pick<FormTemplateModel, 'title' | 'content' | 'status'> & {
        id?: string;
        submitAction?: string;
        submitSuccessRedirect?: string;
        submitSuccessTips?: string;
        featureImage?: string;
      }
    >({
      id: props.id,
      title: '',
      content: '',
      status: TemplateStatus.Draft,
      submitAction: '',
      submitSuccessRedirect: '',
      submitSuccessTips: '',
      featureImage: '',
    });
    const cachedFormData = ref<typeof formData>();
    const cacheContentData: Record<string, string> = {};

    const featureImageModalVisible = ref(false);
    const featureImageDisplaySrc = computed(() => {
      let path: string;

      if (formData.featureImage && (path = safeJSONParse(formData.featureImage)?.thumbnail ?? formData.featureImage)) {
        return locationMixin.getMediaPath(path);
      }
      return null;
    });

    // fixed link
    const fixedLinkRef = computed(() => {
      if (!cachedFormData.value) return '';
      // 使用cache data, 保存后生效
      return trailingSlash(homeUrl.value ?? '/') + `f/${cachedFormData.value.id}`;
    });

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
      canEdit: false,
      canEditPublished: false,
      canDelete: false,
      canDeletePublished: false,
      canPublish: false,
    });

    const isSelfContentRef = ref(false);

    expose({
      unsavedContent: toRef(actionStatus, 'changed'),
    });

    watch(
      formData,
      (value) => {
        actionStatus.changed = !equals(cachedFormData.value, value);
      },
      { deep: true },
    );

    let formPromise: Promise<FormTemplateModel | undefined>;
    if (!formData.id) {
      // 新建自动草稿
      formPromise = formApi
        .create({
          variables: {},
          catchError: true,
          loading: true,
        })
        .then(({ form }) => {
          formData.id = form.id;
          router.replace({ name: 'form-edit', params: { id: form.id } });
          return {
            ...form,
            title: '',
          };
        });
    } else {
      formPromise = formApi
        .get({
          variables: {
            id: formData.id,
          },
          catchError: true,
          loading: true,
        })
        .then(({ form }) => {
          if (form) {
            return form;
          } else {
            message.error('表单不存在', () => {
              router.replace({ name: 'forms' });
            });
            return;
          }
        });
    }

    Promise.all([formPromise, userManager.getUser()]).then(([form, user]) => {
      if (!form) return;

      const { title, content, status, metas } = form;

      // edit modal
      formData.title = title;
      formData.content = content;
      formData.status = status;

      if (content) {
        const { schema, framework } = getFrameworkSchema(content);
        schemaFrameworkRef.value = framework;

        if (framework === 'FORMILYJS') {
          formilyMixin.setSchemas(schema);
        }
      }

      if (schemaFrameworkRef.value === 'FORMILYJS') {
        // treenode changed
        formilyMixin.addTreeNodeChangedEffect((payload) => {
          warn(process.env.NODE_ENV === 'production', `debugger ${payload.type}`);
          actionStatus.changed = true;
        });
      }

      // action config
      formData.submitAction = metas?.find(({ key }) => key === FormMetaPresetKeys.SubmitAction)?.value ?? '';
      formData.submitSuccessRedirect =
        metas?.find(({ key }) => key === FormMetaPresetKeys.SubmitSuccessRedirect)?.value ?? '';
      formData.submitSuccessTips = metas?.find(({ key }) => key === FormMetaPresetKeys.SubmitSuccessTips)?.value ?? '';

      // feature image
      formData.featureImage = metas?.find(({ key }) => key === FormMetaPresetKeys.FeatureImage)?.value ?? '';

      // settings display
      let settingsDisplay;
      if ((settingsDisplay = metas?.find(({ key }) => key === FormMetaPresetKeys.SettingsDisplay)?.value) !== void 0) {
        settingsDisplayRef.value = settingsDisplay.split(',');
      }

      // 缓存最新数据
      cachedFormData.value = { ...formData };

      actionStatus.changed = false;
      actionStatus.disabledActions = false;

      let hasPermission = (_: UserCapability) => false;
      if (user?.profile.role) {
        const role = userMixin.getRole(user.profile.role);
        hasPermission = role.hasPermission.bind(undefined);
      }

      actionCapability.canEdit = hasPermission(UserCapability.EditTemplates);
      actionCapability.canEditPublished = hasPermission(UserCapability.EditPublishedTemplates);
      actionCapability.canDelete = hasPermission(UserCapability.DeleteTemplates);
      actionCapability.canDeletePublished = hasPermission(UserCapability.DeletePublishedTemplates);
      actionCapability.canPublish = hasPermission(UserCapability.PublishTemplates);

      if (user?.profile.sub !== form.author?.id) {
        actionCapability.canEdit = actionCapability.canEdit && hasPermission(UserCapability.EditOthersTemplates);

        if (status === TemplateStatus.Private) {
          actionCapability.canDelete = actionCapability.canEdit && hasPermission(UserCapability.EditPrivateTemplates);
        }

        actionCapability.canDelete = actionCapability.canDelete && hasPermission(UserCapability.DeleteOthersTemplates);

        if (actionCapability.canDelete && status === TemplateStatus.Private) {
          actionCapability.canDelete =
            actionCapability.canDelete && hasPermission(UserCapability.DeletePrivateTemplates);
        }
      }

      isSelfContentRef.value = user?.profile.sub === String(form.author?.id);

      // cache content when schema framework changed
      watch(schemaFrameworkRef, (value, old) => {
        cacheContentData[old] = formData.content;
        formData.content = cacheContentData[value] || '';
      });

      // save settings to sever
      watch(settingsDisplayRef, (value) => {
        templateApi.updateMetaByKey({
          variables: {
            templateId: formData.id!,
            metaKey: FormMetaPresetKeys.SettingsDisplay,
            metaValue: value.join(','),
            createIfNotExists: true,
          },
        });
      });
    });

    // formily screen switch
    observe(engine.screen, (changed) => {
      if (changed.type === 'set' && changed.key === 'type') {
        formilyMixin.screenChange(changed.value, changed.oldValue);
      }
    });

    // 提交
    const onSubmit = async (status?: TemplateStatus) => {
      let schema: any = formData.content;
      if (schemaFrameworkRef.value === 'FORMILYJS') {
        schema = formilyMixin.getSchmeas();
      }

      return formApi
        .update({
          variables: {
            id: formData.id!,
            updateForm: {
              title: formData.title,
              content: toFrameworkContent(schema, schemaFrameworkRef.value),
              status,
            },
            submitAction: formData.submitAction,
            submitSuccessRedirect: formData.submitSuccessRedirect,
            submitSuccessTips: formData.submitSuccessTips,
            featureImage: formData.featureImage,
          },
          loading: () => {
            actionStatus.processing = true;
            return () => {
              actionStatus.processing = false;
            };
          },
        })
        .then(() => {
          status && (formData.status = status);
          // 缓存最新数据
          cachedFormData.value = { ...formData };
          actionStatus.changed = false;
        })
        .catch((err) => {
          message.error(`修改失败，${err.message}`);
        });
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
      const status = formData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Draft;
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
      const status = formData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Publish;
      onSubmit(status).finally(() => {
        actionStatus.publishing = false;
      });
    };

    // 私有发布，修改post 并将状态修改为 Private
    // const handleMakePrivate = () => {
    //   const status = TemplateStatus.Private;
    //   onSubmit(status);
    // };

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

    // 上传
    const handleUploadRequest = designerMixin.getCustomUploadRequest('templates/form_');

    return () => (
      <DesignLayout
        status={formData.status}
        actionStatus={actionStatus}
        actionCapability={actionCapability}
        isSelfContent={isSelfContentRef.value}
        siderCollapsed={siderCollapsedRef.value}
        siderDrawerMode="always"
        siderTitle={i18n.tv('page_templates.forms.design.sider_title', '表单设置') as string}
        {...{
          scopedSlots: {
            settingsContent: () => (
              <Form labelAlign="left" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={i18n.tv('page_templates.visibility_label', '可见性')} class="px-3">
                  TODO
                </Form.Item>
                <Form.Item label={i18n.tv('page_templates.publish_set_label', '发布')} class="px-3">
                  TODO
                </Form.Item>
                <Divider class="mt-4 mb-0" />
                <Collapse
                  class="shades transparent"
                  bordered={false}
                  activeKey="statusAndVisibility"
                  expand-icon-position="right"
                >
                  <Collapse.Panel header={i18n.tv('page_templates.forms.design.submit_config_label', '提交')}>
                    <p class="mb-1">{i18n.tv('page_templates.forms.design.submit_action_label', '地址：')}</p>
                    <Input
                      vModel={formData.submitAction}
                      placeholder={i18n.tv('page_templates.forms.design.submit_action_placeholder', '请输入地址')}
                    />
                    <p class="mt-3 mb-1">
                      {i18n.tv('page_templates.forms.design.submit_success_redirect_label', '成功跳转地址：')}
                    </p>
                    <Input
                      vModel={formData.submitSuccessRedirect}
                      placeholder={i18n.tv(
                        'page_templates.forms.design.submit_success_redirect_placeholder',
                        '请输入成功跳转地址',
                      )}
                    />
                    <p class="mt-3 mb-1">
                      {i18n.tv('page_templates.forms.design.submit_success_tips_label', '成功提示文案：')}
                    </p>

                    <Input
                      vModel={formData.submitSuccessTips}
                      placeholder={i18n.tv(
                        'page_templates.forms.design.submit_success_tips_placeholder',
                        '请输入请求成功提示文案',
                      )}
                    />
                  </Collapse.Panel>
                  {settingsDisplayRef.value.includes(Settings.FixedLink) && (
                    <Collapse.Panel header={i18n.tv('page_templates.fixed_link_label', '固定链接')}>
                      <p>{i18n.tv('page_templates.forms.design.view', '查看表单')}</p>
                      <a href={fixedLinkRef.value} class={classes.fixedLink} target="preview">
                        {fixedLinkRef.value}
                        <Icon component={IconLinkExternal} class="ml-1" />
                      </a>
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.FeatureImage) && (
                    <Collapse.Panel header={i18n.tv('page_templates.feature_image_label', '特色图片')}>
                      <div class={classes.featureImageSelector} onClick={() => (featureImageModalVisible.value = true)}>
                        {formData.featureImage ? (
                          <div class={classes.featureImageCover}>
                            <img
                              src={featureImageDisplaySrc.value}
                              alt="feature-image"
                              style="object-fit: contain; width: 100%; max-height: 120px;"
                            />
                            <Space class={classes.featureImageCoverActions}>
                              <Button shape="circle" icon="select" />
                              <Button
                                shape="circle"
                                icon="delete"
                                vOn:click_prevent_stop={() => (formData.featureImage = '')}
                              />
                            </Space>
                          </div>
                        ) : (
                          <div class={classes.featureImageAdd}>
                            <Icon type="plus" />
                            <div class="text--secondary">
                              {i18n.tv('page_templates.upload_feature_image_label', '设置特色图片')}
                            </div>
                          </div>
                        )}
                      </div>
                      <p class="font-size-xs text--secondary">
                        {i18n.tv('page_templates.feature_image_tips', '推荐尺寸：1980x300(px)')}
                      </p>
                      <Modal
                        title={i18n.tv('page_templates.feature_image_modal.title', '选择特色图片')}
                        visible={featureImageModalVisible.value}
                        width={932}
                        footer={null}
                        onCancel={() => (featureImageModalVisible.value = false)}
                      >
                        <MediaList
                          selectable
                          selectConfirm={false}
                          accept="image/png,image/jpg"
                          size="small"
                          pageSize={9}
                          showSizeChanger={false}
                          objectPrefixKey="templates/form_"
                          onSelect={(path, media) => {
                            formData.featureImage = JSON.stringify({
                              id: media.id,
                              path: media.path,
                              thumbnail: media.thumbnail?.path,
                            });
                            featureImageModalVisible.value = false;
                          }}
                        />
                      </Modal>
                    </Collapse.Panel>
                  )}
                  <Collapse.Panel header={i18n.tv('page_templates.title_label', '标题')}>
                    <Input
                      vModel={formData.title}
                      placeholder={i18n.tv('page_templates.title_placeholder', '请输入标题')}
                    />
                  </Collapse.Panel>
                </Collapse>
              </Form>
            ),
            extraContent: () => (
              <div style="width: 220px">
                <p class="font-weight-bold mb-2">{i18n.tv('page_templates.setting_header.designer', '设计器：')}</p>
                <Radio.Group vModel={schemaFrameworkRef.value}>
                  {schemaFrameworkOptions.value.map((option) => (
                    <Radio value={option.value} class="d-block line-height-lg">
                      {option.label}
                    </Radio>
                  ))}
                </Radio.Group>
                <p class="font-weight-bold mb-2 mt-3">
                  {i18n.tv('page_templates.setting_header.display', '显示设置：')}
                </p>
                <Checkbox.Group vModel={settingsDisplayRef.value}>
                  {settingsDisplayOptions.value.map((option) => (
                    <Checkbox value={option.value} class="d-block line-height-lg ml-0">
                      {option.label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            ),
          },
          on: {
            logoClick: () => router.back(),
            update: handleUpdate,
            publish: handelPublish,
            saveToDraft: handleSaveToDraft,
            switchToDraft: handleSwitchToDraft,
            submitReview: handleSubmitReview,
            approveReview: handleApproveReview,
            rejectReview: handleRejectReview,
          },
        }}
      >
        {schemaFrameworkRef.value === 'FORMILYJS' ? (
          <Designer
            engine={engine}
            theme={configProvider.theme === Theme.Dark ? 'dark' : 'light'}
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
                <SettingsPanel title="panels.PropertySettings">
                  <SettingsForm
                    uploadMethod="PUT"
                    uploadCustomRequest={(options: any) => handleUploadRequest(options)}
                    headers={{}}
                    effects={() => {
                      onFieldInputValueChange('*', (field) => {
                        field.valid && (actionStatus.changed = true);
                      });
                    }}
                  ></SettingsForm>
                </SettingsPanel>
              </StudioPanel>
            </Workbench>
          </Designer>
        ) : (
          <div>{`设计器类型"${schemaFrameworkRef.value}"暂不支持`}</div>
        )}
      </DesignLayout>
    );
  },
});

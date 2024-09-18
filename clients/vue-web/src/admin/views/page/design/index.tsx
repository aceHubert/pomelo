import { defineComponent, ref, reactive, computed, watch, toRef } from '@vue/composition-api';
import { useRouter } from 'vue2-helpers/vue-router';
import { createDesigner, GlobalRegistry } from '@designable/core';
import { onFieldInputValueChange } from '@formily/core';
import { observe } from '@formily/reactive';
import { FragmentComponent } from '@formily/vue';
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
import { trailingSlash, equals, warn } from '@ace-util/core';
import { Button, Divider, Icon, Form, Input, Collapse, Checkbox, Radio, Space } from 'ant-design-vue';
import { useConfigProvider, expose } from 'antdv-layout-pro/shared';
import { Theme } from 'antdv-layout-pro/types';
import {
  OptionPresetKeys,
  UserCapability,
  getFrameworkSchema,
  toFrameworkContent,
  type SchemaFramework,
} from '@ace-pomelo/shared/client';
import { Modal, message } from '@/components';
import { useTemplateApi, usePageApi, PageMetaPresetKeys, TemplateStatus, TemplateCommentStatus } from '@/fetch/apis';
import { useI18n, useUserManager, useOptions } from '@/hooks';
import { useLocationMixin } from '@/mixins';
import { safeJSONParse } from '@/utils';
import { useUserMixin, useDesignerMixin, useFormilyMixin } from '@/admin/mixins';
import IconLinkExternal from '@admin/assets/icons/link-external.svg?inline';
import { MediaList } from '../../media/components';
import { DesignLayout, HtmlEditor } from '../../post/components';
import { ResourceWidgets, ComponentWidget, PreviewWidget, SchemaEditorWidget } from './widgets';
import classes from './index.module.less';

// Types
import type { TreeNode, ITreeNode } from '@designable/core';
import type { PageTemplateModel } from '@/fetch/apis';
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
  Comment = 'comment',
}

export default defineComponent({
  name: 'PageDesign',
  layout: 'blank',
  props: {
    id: String,
  },
  head() {
    return {
      title: this.$tv('page_templates.pages.design.page_title', '页面设计') as string,
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
        this.$tv('page_templates.pages.tips.unsaved_confirm', '未保存页面配置将会丢失，是否离开页面？') as string,
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
    const userMixin = useUserMixin();
    const designerMixin = useDesignerMixin();
    const locationMixin = useLocationMixin();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const templateApi = useTemplateApi();
    const pageApi = usePageApi();

    GlobalRegistry.setDesignerLanguage(i18n.locale || 'en-US');

    const engine = createDesigner({
      shortcuts: [],
      rootComponentName: 'Page',
      // defaultScreenType: ScreenType.Mobile,
    });

    const formilyMixin = useFormilyMixin(engine, 'page');

    // #region data scopes 新增、修改、查询
    const siderCollapsedRef = ref(true);

    const schemaFrameworkOptions = computed(() => [
      { label: 'Formily', value: 'FORMILYJS' },
      { label: 'HTML', value: 'HTML' },
    ]);
    const schemaFrameworkRef = ref<SchemaFramework>(schemaFrameworkOptions.value[0].value as SchemaFramework);

    const settingsDisplayOptions = computed(() => [
      { label: i18n.tv('page_templates.fixed_link_label', '固定链接'), value: Settings.FixedLink },
      { label: i18n.tv('page_templates.feature_image_label', '特色图片'), value: Settings.FeatureImage },
      { label: i18n.tv('page_templates.discussion_label', '讨论'), value: Settings.Comment },
    ]);
    const settingsDisplayRef = ref<Settings[]>(settingsDisplayOptions.value.map(({ value }) => value));

    const pageData = reactive<
      Pick<PageTemplateModel, 'title' | 'name' | 'content' | 'status'> & {
        id?: string;
        featureImage?: string;
        allowComment?: boolean;
      }
    >({
      id: props.id,
      name: '',
      title: '',
      content: '',
      status: TemplateStatus.Draft,
      featureImage: '',
      allowComment: false,
    });
    const cachedPageData = ref<typeof pageData>();
    const cacheContentData: Record<string, string> = {};

    const featureImageModalVisible = ref(false);
    const featureImageDisplaySrc = computed(() => {
      let path: string;

      if (pageData.featureImage && (path = safeJSONParse(pageData.featureImage)?.thumbnail ?? pageData.featureImage)) {
        return locationMixin.getMediaPath(path);
      }
      return null;
    });

    // fixed link
    const fixedLinkRef = computed(() => {
      if (!cachedPageData.value) return '';
      // 使用cache data, 保存后生效
      return trailingSlash(homeUrl.value ?? '/') + (cachedPageData.value.name || cachedPageData.value.id);
    });
    const fixedLinkUploadingRef = ref(false);
    const fixedLinkNameRef = ref('');

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
      pageData,
      (value) => {
        actionStatus.changed = !equals(cachedPageData.value, value);
      },
      { deep: true },
    );

    let pagePromise: Promise<PageTemplateModel | undefined>;
    if (!pageData.id) {
      // 新建自动草稿
      pagePromise = pageApi
        .create({
          variables: {},
          catchError: true,
          loading: true,
        })
        .then(({ page }) => {
          pageData.id = page.id;
          router.replace({ name: 'page-edit', params: { id: page.id } });
          return {
            ...page,
            title: '',
          };
        });
    } else {
      pagePromise = pageApi
        .get({
          variables: {
            id: pageData.id,
          },
          catchError: true,
          loading: true,
        })
        .then(({ page }) => {
          if (page) {
            return page;
          } else {
            message.error('页面不存在', () => {
              router.replace({ name: 'pages' });
            });
            return;
          }
        });
    }

    Promise.all([pagePromise, userManager.getUser()]).then(([page, user]) => {
      if (!page) return;

      const { title, name, content, status, commentStatus, metas } = page;

      // edit modal
      pageData.title = title;
      pageData.name = name;
      pageData.content = content;
      pageData.status = status;
      pageData.allowComment = commentStatus === TemplateCommentStatus.Open;

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

      // feature image
      pageData.featureImage = metas?.find(({ key }) => key === PageMetaPresetKeys.FeatureImage)?.value ?? '';

      // settings display
      let settingsDisplay;
      if ((settingsDisplay = metas?.find(({ key }) => key === PageMetaPresetKeys.SettingsDisplay)?.value) !== void 0) {
        settingsDisplayRef.value = settingsDisplay.split(',');
      }

      // 缓存最新数据
      cachedPageData.value = { ...pageData };

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

      if (user?.profile.sub !== page.author?.id) {
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

      isSelfContentRef.value = user?.profile.sub === String(page.author?.id);

      // cache content when schema framework changed
      watch(schemaFrameworkRef, (value, old) => {
        cacheContentData[old] = pageData.content;
        pageData.content = cacheContentData[value] || '';
      });

      // save settings to sever
      watch(settingsDisplayRef, (value) => {
        templateApi.updateMetaByKey({
          variables: {
            templateId: pageData.id!,
            metaKey: PageMetaPresetKeys.SettingsDisplay,
            metaValue: value.join(','),
            createIfNotExists: true,
          },
        });
      });
    });

    observe(engine.screen, (changed) => {
      if (changed.type === 'set' && changed.key === 'type') {
        formilyMixin.screenChange(changed.value, changed.oldValue);
      }
    });

    // 提交
    const onSubmit = async (status?: TemplateStatus) => {
      let schema: any = pageData.content;
      if (schemaFrameworkRef.value === 'FORMILYJS') {
        schema = formilyMixin.getSchmeas();
      }

      return pageApi
        .update({
          variables: {
            id: pageData.id!,
            updatePage: {
              title: pageData.title,
              name: pageData.name,
              content: toFrameworkContent(schema, schemaFrameworkRef.value),
              status,
              commentStatus: pageData.allowComment ? TemplateCommentStatus.Open : TemplateCommentStatus.Closed,
            },
            featureImage: pageData.featureImage,
          },
          loading: () => {
            actionStatus.processing = true;
            return () => {
              actionStatus.processing = false;
            };
          },
        })
        .then(() => {
          status && (pageData.status = status);
          // 缓存最新数据
          cachedPageData.value = { ...pageData };
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
      const status = pageData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Draft;
      onSubmit(status).finally(() => {
        actionStatus.savingToDarft = false;
      });
    };

    // 从发布状态（包括 private）切换到草稿状态，修改post 并将状态修改为draft
    // 当 status 是 private 时，强制修改成 draft, 显示将会变为public
    const handleSwitchToDraft = () => {
      Modal.confirm({
        content: i18n.tv('page_templates.pages.tips.unpublishe_confirm', '确认是否将已发布页面配置放入到草稿箱？'),
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
      const status = pageData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Publish;
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

    const handleUploadRequest = designerMixin.getCustomUploadRequest('templates/page_');

    return () => (
      <DesignLayout
        status={pageData.status}
        actionStatus={actionStatus}
        actionCapability={actionCapability}
        isSelfContent={isSelfContentRef.value}
        siderCollapsed={siderCollapsedRef.value}
        siderDrawerMode={schemaFrameworkRef.value === 'HTML' ? 'auto' : 'always'}
        siderTitle={i18n.tv('page_templates.pages.design.sider_title', '页面设置') as string}
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
                <Divider class="my-0" />
                <Collapse
                  bordered={false}
                  activeKey="statusAndVisibility"
                  expand-icon-position="right"
                  class="shades transparent"
                >
                  {settingsDisplayRef.value.includes(Settings.FixedLink) && (
                    <Collapse.Panel header={i18n.tv('page_templates.fixed_link_label', '固定链接')}>
                      {!fixedLinkUploadingRef.value ? (
                        <FragmentComponent>
                          <p class="mb-1">{i18n.tv('page_templates.pages.design.view', '查看页面')}</p>
                          <a href={fixedLinkRef.value} class={classes.fixedLink} target="preview">
                            {fixedLinkRef.value}
                            <Icon component={IconLinkExternal} class="ml-1" />
                          </a>
                          <p class="mt-2">
                            <a href="javascript:;" onClick={() => (fixedLinkUploadingRef.value = true)}>
                              {i18n.tv('page_templates.set_fixed_link_btn_text', '修改固定链接')}
                            </a>
                          </p>
                        </FragmentComponent>
                      ) : (
                        <Space size="small">
                          <Input
                            value={pageData.name || pageData.id}
                            prefix="/"
                            onChange={(e: any) => (fixedLinkNameRef.value = e.target.value)}
                          ></Input>
                          <Button
                            onClick={() => {
                              pageData.name = fixedLinkNameRef.value;
                              fixedLinkUploadingRef.value = false;
                            }}
                          >
                            {i18n.tv('common.btn_text.confirm', '确认')}
                          </Button>
                        </Space>
                      )}
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.FeatureImage) && (
                    <Collapse.Panel header={i18n.tv('page_templates.feature_image_label', '特色图片')}>
                      <div class={classes.featureImageSelector} onClick={() => (featureImageModalVisible.value = true)}>
                        {pageData.featureImage ? (
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
                                vOn:click_prevent_stop={() => (pageData.featureImage = '')}
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
                          objectPrefixKey="templates/page_"
                          onSelect={(path, media) => {
                            pageData.featureImage = JSON.stringify({
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
                      vModel={pageData.title}
                      placeholder={i18n.tv('page_templates.title_placeholder', '请输入标题')}
                    />
                  </Collapse.Panel>
                  {settingsDisplayRef.value.includes(Settings.Comment) && (
                    <Collapse.Panel header={i18n.tv('page_templates.discussion_label', '讨论')}>
                      <Checkbox vModel={pageData.allowComment}>
                        {i18n.tv('page_templates.allow_comment_label', '允许评论')}
                      </Checkbox>
                    </Collapse.Panel>
                  )}
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
                  {' '}
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
                      scopedSlots={{
                        default: (tree: TreeNode, onChange: (tree: ITreeNode) => void) => (
                          <SchemaEditorWidget tree={tree} onChange={onChange}></SchemaEditorWidget>
                        ),
                      }}
                    ></ViewPanel>
                    <ViewPanel
                      type="PREVIEW"
                      scrollable={false}
                      scopedSlots={{
                        default: (tree: TreeNode) => <PreviewWidget tree={tree}></PreviewWidget>,
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
        ) : schemaFrameworkRef.value === 'HTML' ? (
          <HtmlEditor
            vModel={pageData.content}
            disabled={actionStatus.processing}
            placeholder={i18n.tv('page_templates.schema_placeholder', '请输入页面内容') as string}
          ></HtmlEditor>
        ) : (
          <div>{`设计器类型"${schemaFrameworkRef.value}"暂不支持`}</div>
        )}
      </DesignLayout>
    );
  },
});

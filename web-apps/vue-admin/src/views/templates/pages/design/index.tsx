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
import { trailingSlash, isAbsoluteUrl, equals, warn } from '@ace-util/core';
import { Button, Divider, Icon, Form, Input, Collapse, Checkbox, Upload, Space } from 'ant-design-vue';
import { useConfigProvider, expose } from 'antdv-layout-pro/shared';
import { Theme } from 'antdv-layout-pro/types';
import {
  OptionPresetKeys,
  TemplateStatus,
  TemplateCommentStatus,
  PageMetaPresetKeys,
  getFrameworkSchema,
  toFrameworkContent,
  type SchemaFramework,
} from '@pomelo/shared-web';
import { Modal, message } from '@/components';
import { usePageApi } from '@/fetch/graphql';
import { useI18n, useUserManager, useOptions } from '@/hooks';
import { DesignLayout, HtmlEditor } from '../../components';
import { useDesignMixin } from '../../mixins/design.mixin';
import { useFormilyMixin } from '../../mixins/formily.mixin';
import { ResourceWidgets, ComponentWidget, PreviewWidget, SchemaEditorWidget } from './widgets';
import classes from './index.module.less';

// Types
import type { Ref } from '@vue/composition-api';
import type { TreeNode, ITreeNode } from '@designable/core';
import type { PageTemplateModel } from '@/fetch/graphql';
import type { ActionStatus, ActionCapability } from '../../components/design-layout/DesignLayout';

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
    const unsaved = this.unsavedContent as Ref<boolean>;
    if (unsaved.value) {
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
    const designMixin = useDesignMixin();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
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
    const schemaFrameworkRef = ref<SchemaFramework>('FORMILYJS');

    const pageData = reactive<
      Pick<PageTemplateModel, 'title' | 'name' | 'content' | 'status'> & {
        id?: number;
        featureImage?: string;
        allowComment?: boolean;
      }
    >({
      id: props.id ? Number(props.id) : void 0,
      name: '',
      title: '',
      content: '',
      status: TemplateStatus.Draft,
      featureImage: '',
      allowComment: false,
    });
    const cachedPageData = ref<typeof pageData>();

    const featureImageUploadingRef = ref(false);
    const featureDisplayImageRef = computed(() => {
      const value = pageData.featureImage;
      if (!value) return undefined;
      if (isAbsoluteUrl(value)) return value;

      return trailingSlash(siteUrl.value) + (value.startsWith('/') ? value.slice(1) : value);
    });

    // fixed link
    const fixedLinkRef = computed(() => {
      if (!cachedPageData.value) return '';
      // 使用cache data, 保存后生效
      return trailingSlash(homeUrl.value) + (cachedPageData.value.name || cachedPageData.value.id);
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
      operate: false,
      publish: false,
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
              router.replace({ name: ' 页面不存在' });
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
          warn(process.env.NODE_ENV === 'production', payload.type);
          actionStatus.changed = true;
        });
      }

      // feature image
      pageData.featureImage = metas?.find(({ key }) => key === PageMetaPresetKeys.FeatureImage)?.value ?? '';

      // 缓存最新数据
      cachedPageData.value = { ...pageData };

      actionStatus.changed = false;
      actionStatus.disabledActions = false;

      // TODO: 设置条件管理员权限
      if (user?.profile.role?.includes('isp.admin')) {
        actionCapability.operate = true;
        actionCapability.publish = true;
      } else {
        // 只能操作自己的
        if (user?.profile.sub === page.author) {
          actionCapability.operate = true;
        }
      }

      isSelfContentRef.value = user?.profile.sub === page.author;
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

    const handleUploadRequest = designMixin.getCustomUploadRequest('templates/page_');

    return () => (
      <DesignLayout
        status={pageData.status}
        actionStatus={actionStatus}
        actionCapability={actionCapability}
        isSelfContent={isSelfContentRef.value}
        siderCollapsed={siderCollapsedRef.value}
        siderDrawerMode="always"
        siderTitle={i18n.tv('page_templates.pages.design.sider_title', '页面设置') as string}
        {...{
          scopedSlots: {
            siderContent: () => (
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
                  {!!fixedLinkRef.value && (
                    <Collapse.Panel header={i18n.tv('page_templates.fixed_link_label', '固定链接')}>
                      {!fixedLinkUploadingRef.value ? (
                        <FragmentComponent>
                          <p class="mb-1">{i18n.tv('page_templates.pages.design.view', '查看页面')}</p>
                          <a href={fixedLinkRef.value} target="preview-route">
                            {fixedLinkRef.value}
                            <Icon type="link" class="ml-1" />
                          </a>
                          <p class="mt-2">
                            <a href="javascript:;" type="link" onClick={() => (fixedLinkUploadingRef.value = true)}>
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
                  <Collapse.Panel header={i18n.tv('page_templates.feature_image_label', '特色图片')}>
                    <Upload
                      name="feature-image"
                      listType="picture-card"
                      class={classes.featureImageUploader}
                      accept="image/png, image/jpeg"
                      showUploadList={false}
                      disabled={featureImageUploadingRef.value}
                      method="PUT"
                      customRequest={(options: any) => handleUploadRequest(options)}
                      onChange={({ file: { status, response } }) => {
                        if (status === 'uploading') {
                          featureImageUploadingRef.value = true;
                        } else if (status === 'done') {
                          pageData.featureImage = response.path || response.fullPath || response?.url;
                          featureImageUploadingRef.value = false;
                        } else {
                          featureImageUploadingRef.value = false;
                        }
                      }}
                    >
                      {featureDisplayImageRef.value ? (
                        <div class={classes.featureImageCover}>
                          <img
                            src={featureDisplayImageRef.value}
                            alt="feature-image"
                            style="object-fit: contain; width: 100%; max-height: 120px;"
                          />
                          <Space class={classes.featureImageCoverActions}>
                            <Button shape="circle" icon="edit" />
                            <Button
                              shape="circle"
                              icon="delete"
                              vOn:click_prevent_stop={() => (pageData.featureImage = '')}
                            />
                          </Space>
                        </div>
                      ) : (
                        <div>
                          <Icon type={featureDisplayImageRef.value ? 'loading' : 'plus'} />
                          <div class="text--secondary">
                            {i18n.tv('page_templates.upload_feature_image_label', '设置特色图片')}
                          </div>
                        </div>
                      )}
                    </Upload>
                    <p class="font-size-xs text--secondary">
                      {i18n.tv('page_templates.feature_image_tips', '推荐尺寸：1980x300(px)')}
                    </p>
                  </Collapse.Panel>
                  <Collapse.Panel header={i18n.tv('page_templates.title_label', '标题')}>
                    <Input
                      vModel={pageData.title}
                      placeholder={i18n.tv('page_templates.title_placeholder', '请输入标题')}
                    />
                  </Collapse.Panel>
                  <Collapse.Panel header={i18n.tv('page_templates.discussion_label', '讨论')}>
                    <Checkbox vModel={pageData.allowComment}>
                      {i18n.tv('page_templates.allow_comment_label', '允许评论')}
                    </Checkbox>
                  </Collapse.Panel>
                </Collapse>
              </Form>
            ),
          },
          on: {
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

import { debounce } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { createDesigner, GlobalRegistry, ScreenType } from '@designable/core';
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
import { Divider, Collapse, Icon, Form, Input, TreeSelect } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { jsonSerializeReviver, jsonDeserializeReviver, obsUpload, obsFormatDisplayUrl } from '@pomelo/shared-web';
import { useResApi, formatError, TemplateStatus, usePageApi } from '@/fetch/graphql';
import { useI18n, useUserManager } from '@/hooks';
import { DesignLayout } from '../../components';
import { useDesignMixin } from '../../mixins/design.mixin';
import { transformToPageSchema, transformToPageTreeNode } from './utils';
import { ResourceWidgets, ComponentWidget, PreviewWidget, SchemaEditorWidget } from './widgets';
import classes from '../styles/design.module.less';

// Types
import type { TreeNode, ITreeNode } from '@designable/core';
import type { IFormilySchema } from '@designable/formily-transformer';
import type { NewPageTemplateInput, UpdatePageTemplateInput } from '@/fetch/graphql';
import type { ActionStatus, ActionCapability } from '../../components/design-layout/DesignLayout';

const SchemaMobileMetaKey = 'schema.mobile';
const SchemaPcMetaKey = 'schema.pc';

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
    if (this.actionStatus.changed) {
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
    const route = useRoute();
    const i18n = useI18n();
    const userManager = useUserManager();
    const pageApi = usePageApi();
    const resApi = useResApi();
    const designMixin = useDesignMixin();

    GlobalRegistry.setDesignerLanguage(i18n.locale || 'en-US');

    const engine = createDesigner({
      shortcuts: [],
      rootComponentName: 'Page',
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

        engine.setCurrentTree(newTreeNode || transformToPageTreeNode({}));
        engine.workbench.currentWorkspace.operation.hover.clear();
        engine.workbench.currentWorkspace.operation.selection.select(engine.getCurrentTree());
      }
    });

    // #region data scopes 新增、修改、查询
    const isAddMode = computed(() => route.name === 'page-add');
    const siderCollapsedRef = ref(true);
    const nameRef = ref('');
    const titleRef = ref('');
    const statusRef = ref<TemplateStatus>();

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

    // 获取页面详情
    const getPageDetail = async (id: string) => {
      const { page } = await pageApi.get({
        variables: {
          id,
          metaKeys: [SchemaMobileMetaKey, SchemaPcMetaKey],
        },
        catchError: true,
        loading: true,
      });

      if (page) {
        const { name, title, schema, status, categories } = page;

        // edit model
        nameRef.value = name;
        titleRef.value = title;
        treeNodesCache.responsive = transformToPageTreeNode(JSON.parse(schema, jsonDeserializeReviver()));
        // 设置当前设计器的值
        engine.screen.type === ScreenType.Responsive && engine.setCurrentTree(treeNodesCache.responsive);

        // status
        statusRef.value = status;

        // platform
        let mobileMeta: { id: number; value: string } | undefined, pcMeta: { id: number; value: string } | undefined;
        if ((mobileMeta = page.metas.find(({ key }) => key === SchemaMobileMetaKey))) {
          treeNodesCache.mobile = {
            id: mobileMeta.id,
            value: transformToPageTreeNode(JSON.parse(mobileMeta.value, jsonDeserializeReviver())),
          };
          // 设置当前设计器的值
          engine.screen.type === ScreenType.Mobile && engine.setCurrentTree(treeNodesCache.mobile.value);
        }
        if ((pcMeta = page.metas.find(({ key }) => key === SchemaPcMetaKey))) {
          treeNodesCache.pc = {
            id: pcMeta.id,
            value: transformToPageTreeNode(JSON.parse(pcMeta.value, jsonDeserializeReviver())),
          };
          // 设置当前设计器的值
          engine.screen.type === ScreenType.PC && engine.setCurrentTree(treeNodesCache.pc.value);
        }

        // category
        designMixin.getCategories().then((treeData) => {
          designMixin.category.treeData = treeData;
          designMixin.category.selectKeys = categories.map(({ id, name }) => ({ value: id, label: name }));
        });
      } else {
        message.error({
          content: '页面不存在',
          onClose: () => {
            router.replace({ name: 'pages' });
          },
        });
      }
      return page;
    };

    // treenode changed
    engine.subscribeWith(['from:node', 'update:node:props', 'update:children'], () => {
      actionStatus.changed = true;
    });

    watch(
      () => props.id,
      async (id) => {
        const user = await userManager.getUser();
        if (!isAddMode.value) {
          const page = await getPageDetail(id!);
          if (page) {
            // TODO: 设置条件管理员权限
            if (user!.profile.role?.includes('isp.admin')) {
              actionCapability.operate = true;
              actionCapability.publish = true;
            } else {
              // 只能操作自己的
              if (user?.profile.sub === page.author) {
                actionCapability.operate = true;
              }
            }

            // 自己不参与 review
            isSelfContentRef.value = user?.profile.sub === page.author;
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
            value: treeNodesCache.mobile?.value || transformToPageTreeNode(JSON.parse(value, jsonDeserializeReviver())),
          };
        } else if (key === SchemaPcMetaKey) {
          treeNodesCache.pc = {
            id,
            value: treeNodesCache.pc?.value || transformToPageTreeNode(JSON.parse(value, jsonDeserializeReviver())),
          };
        }
      });
    };

    // 创建页面
    const createPage = (input: NewPageTemplateInput) => {
      return pageApi
        .create({
          variables: {
            newPageTemplate: input,
          },
          catchError: true,
          loading: () => {
            actionStatus.processing = true;
            return () => {
              actionStatus.processing = false;
            };
          },
        })
        .then(({ page: { id, schema, metas } }) => {
          // 页面不会刷新，需要更新新建的值用于编辑
          input.status && (statusRef.value = input.status);
          !treeNodesCache.responsive &&
            (treeNodesCache.responsive = transformToPageTreeNode(JSON.parse(schema, jsonDeserializeReviver())));
          actionStatus.changed = false;
          setMetaValues(metas);
          router.replace({ name: 'page-edit', params: { id: String(id) } }).then(() => {
            designMixin.getCategories().then((treeData) => {
              designMixin.category.treeData = treeData;
            });
          });
        })
        .catch((err) => {
          err = formatError(err);
          message.error(`新建失败，${err.message}`);
        });
    };

    const updatePage = (
      input: UpdatePageTemplateInput,
      metas?: Array<{ id?: number; metaKey: string; metaValue: string }>,
    ) => {
      actionStatus.processing = true;
      return Promise.all([
        pageApi.update({
          variables: {
            id: props.id!,
            updatePage: input,
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
          err = formatError(err);
          message.error(`修改失败，${err.message}`);
        })
        .finally(() => {
          actionStatus.processing = false;
        });
    };

    // 提交
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
          mobileSchema = transformToPageSchema(engine.getCurrentTree());
          pcSchema = treeNodesCache.pc
            ? transformToPageSchema(treeNodesCache.pc.value, { designableFormName: 'Page' })
            : void 0;
          responsiveSchema = transformToPageSchema(treeNodesCache.responsive || {});
          break;
        case ScreenType.PC:
          mobileSchema = treeNodesCache.mobile ? transformToPageSchema(treeNodesCache.mobile.value) : void 0;
          pcSchema = transformToPageSchema(engine.getCurrentTree());
          responsiveSchema = transformToPageSchema(treeNodesCache.responsive || {});
          break;
        default:
          mobileSchema = treeNodesCache.mobile ? transformToPageSchema(treeNodesCache.mobile.value) : void 0;
          pcSchema = treeNodesCache.pc ? transformToPageSchema(treeNodesCache.pc.value) : void 0;
          responsiveSchema = transformToPageSchema(engine.getCurrentTree());
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

      if (isAddMode.value) {
        await createPage({
          name: nameRef.value,
          title: titleRef.value,
          schema: JSON.stringify(responsiveSchema, jsonSerializeReviver),
          status: status || TemplateStatus.Draft,
          metas: [...schemaMetas].filter(Boolean) as Array<{ metaKey: string; metaValue: string }>,
        });
      } else {
        await updatePage(
          { name: nameRef.value, title: titleRef.value, schema: JSON.stringify(responsiveSchema), status },
          [...schemaMetas].filter(Boolean) as Array<{
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

    const getObsUploadAction = async (file: File) => {
      const suffix = file.name.substring(file.name.lastIndexOf('.'));
      const fileName = Math.random().toString(16).substring(2) + suffix;
      const objectKey = `temp/page_${fileName}`;
      const {
        signedUrl: { url, headers },
      } = await resApi.getObsUploadSignedUrl({
        variables: {
          bucket: 'static-cdn',
          key: objectKey,
          headers: {
            'Content-Type': file.type,
          },
        },
      });

      // type error, obs 上传要从授权中取参数
      return {
        displayUrl: obsFormatDisplayUrl(objectKey),
        action: url,
        headers,
      };
    };

    return {
      engine,
      treeNodesCache,
      actionStatus,
      actionCapability,
      isSelfContent: isSelfContentRef,
      isAddMode,
      siderCollapsed: siderCollapsedRef,
      title: titleRef,
      name: nameRef,
      status: statusRef,
      category: designMixin.category,
      submiting: designMixin.submitingRef,
      loadCategoryData: designMixin.loadCategoryData,
      handleCategoryChange: designMixin.handleCategoryChange,
      handleCategorySearch: debounce(designMixin.handleCategorySearch, 800),
      handleUpdate,
      handelPublish,
      handleMakePrivate,
      handleSaveToDraft,
      handleSwitchToDraft,
      handleSubmitReview,
      handleApproveReview,
      handleRejectReview,
      getObsUploadAction,
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
        siderTitle={this.$tv('page_templates.pages.design.sider_title', '页面设置') as string}
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
                <Divider class="mx-3 my-1" />
                <Form.Item label={this.$tv('page_templates.name_label', '自定义路由')} class="px-3 mb-0">
                  <Input
                    placeholder={this.$tv('page_templates.name_placeholder', '请输入自定义路由')}
                    value={this.name}
                    onInput={(e: any) => {
                      this.name = e.target.value;
                      this.actionStatus.changed = true;
                    }}
                  />
                </Form.Item>
                <Divider class="mt-4 mb-0" />
                <Collapse
                  bordered={false}
                  activeKey="statusAndVisibility"
                  expand-icon-position="right"
                  class="shades transparent"
                >
                  {!this.isAddMode && (
                    <Collapse.Panel header={this.$tv('page_templates.category_label', '分类')}>
                      <TreeSelect
                        value={this.category.selectKeys}
                        treeData={this.category.treeData}
                        loadData={this.loadCategoryData.bind(this)}
                        treeCheckStrictly
                        showSearch
                        treeCheckable
                        treeDataSimpleMode
                        dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
                        placeholder={this.$tv('page_templates.category_placeholder', '请选择分类(或输入搜索分类)')}
                        onSearch={this.handleCategorySearch.bind(this)}
                        onChange={this.handleCategoryChange(this.id!).bind(this)}
                      ></TreeSelect>
                    </Collapse.Panel>
                  )}
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
        <Designer engine={this.engine} class={classes.schemaDesigner}>
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
              <SettingsPanel
                title="panels.PropertySettings"
                extra={<Icon type="setting" onClick={() => (this.formSettingVisable = !this.formSettingVisable)} />}
              >
                <SettingsForm
                  uploadAction={this.getObsUploadAction}
                  uploadMethod="PUT"
                  uploadCustomRequest={(options: any) => obsUpload({ ...options, ...options.action })}
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

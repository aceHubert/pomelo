import { debounce } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch, toRef, onMounted } from '@vue/composition-api';
import { trailingSlash, equals } from '@ace-util/core';
import { useRouter } from 'vue2-helpers/vue-router';
import {
  Button,
  Checkbox,
  Radio,
  Input,
  Form,
  Select,
  TreeSelect,
  Divider,
  Collapse,
  Icon,
  Space,
} from 'ant-design-vue';
import { expose } from 'antdv-layout-pro/shared';
import {
  OptionPresetKeys,
  UserCapability,
  getFrameworkSchema,
  toFrameworkContent,
  type SchemaFramework,
} from '@ace-pomelo/shared/client';
import { Modal, message } from '@/components';
import {
  useTemplateApi,
  usePostApi,
  TemplateStatus,
  TemplatePageType,
  TemplateCommentStatus,
  PostMetaPresetKeys,
} from '@/fetch/apis';
import { useI18n, useUserManager, useOptions, useDeviceType } from '@/composables';
import { useLocationMixin } from '@/mixins';
import { safeJSONParse } from '@/utils';
import { useUserMixin, useDesignerMixin } from '@/admin/mixins';
import IconLinkExternal from '@admin/assets/icons/link-external.svg?inline';
import { MediaList } from '../media/components';
import { DesignLayout, DocumentEditor } from './components';
import classes from './design.module.less';

// Types
import type { PostTemplateModel } from '@/fetch/apis';
import type { ActionStatus, ActionCapability } from './components/design-layout/DesignLayout';

enum Settings {
  FixedLink = 'fixedLink',
  Category = 'category',
  Tag = 'tag',
  FeatureImage = 'featureImage',
  Excerpt = 'excerpt',
  Comment = 'comment',
  Attribute = 'attribute',
}

export default defineComponent({
  name: 'PostDesign',
  layout: 'blank',
  head() {
    return {
      title: this.$tv('page_templates.posts.design.page_title', '撰写文章') as string,
    };
  },
  beforeRouteLeave(to, from, next) {
    const unsaved = this.unsavedContent as boolean;
    if (unsaved) {
      // Tips: Modal.confirm 会在连续后退中失效
      const confirm = window.confirm(
        this.$tv('page_templates.posts.tips.unsaved_confirm', '未保存内容将会丢失，是否离开页面？') as string,
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
  props: {
    id: String,
  },
  setup(props) {
    const router = useRouter();
    const i18n = useI18n();
    const userManager = useUserManager();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const userMixin = useUserMixin();
    const deviceType = useDeviceType();
    const designerMixin = useDesignerMixin();
    const locationMixin = useLocationMixin();
    const templateApi = useTemplateApi();
    const postApi = usePostApi();

    // #region data scopes 新增、修改、查询
    const siderCollapsedRef = ref(true);

    const schemaFrameworkOptions = computed(() => [{ label: 'HTML', value: 'HTML' }]);
    const schemaFrameworkRef = ref<Exclude<SchemaFramework, 'FORMILYJS'>>(
      schemaFrameworkOptions.value[0].value as SchemaFramework,
    );

    const settingsDisplayOptions = computed(() => [
      { label: i18n.tv('page_templates.fixed_link_label', '固定链接'), value: Settings.FixedLink },
      { label: i18n.tv('page_templates.category_label', '分类'), value: Settings.Category },
      { label: i18n.tv('page_templates.tag_label', '标签'), value: Settings.Tag },
      { label: i18n.tv('page_templates.feature_image_label', '特色图片'), value: Settings.FeatureImage },
      { label: i18n.tv('page_templates.posts.excerpt_label', '摘要'), value: Settings.Excerpt },
      { label: i18n.tv('page_templates.discussion_label', '讨论'), value: Settings.Comment },
      { label: i18n.tv('page_templates.posts.attribute_label', '文章属性'), value: Settings.Attribute },
    ]);
    const settingsDisplayRef = ref<Settings[]>(settingsDisplayOptions.value.map(({ value }) => value));

    const postData = reactive<
      Pick<PostTemplateModel, 'title' | 'excerpt' | 'status'> & {
        id?: string;
        content?: any;
        featureImage?: string;
        allowComment?: boolean;
        templatePageType?: TemplatePageType;
      }
    >({
      id: props.id,
      title: '',
      excerpt: '',
      content: '',
      status: TemplateStatus.Draft,
      featureImage: '',
      allowComment: false,
      templatePageType: TemplatePageType.Default,
    });

    const cachedPostData = ref<typeof postData>();
    const cacheContentData: Record<string, string> = {};

    const featureImageModalVisible = ref(false);
    const featureImageDisplaySrc = computed(() => {
      let path: string;

      if (postData.featureImage && (path = safeJSONParse(postData.featureImage)?.thumbnail ?? postData.featureImage)) {
        return locationMixin.getMediaPath(path);
      }
      return null;
    });

    // fixed link
    const fixedLinkRef = computed(() => {
      if (!cachedPostData.value) return '';
      // 使用cache data, 保存后生效
      return trailingSlash(homeUrl.value ?? '/') + `p/${cachedPostData.value.id}`;
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
      disabledActions: true,
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
      postData,
      (value) => {
        actionStatus.changed = !equals(cachedPostData.value, value);
      },
      { deep: true },
    );

    let postPromise: Promise<PostTemplateModel | undefined>;
    if (!postData.id) {
      // 新建自动草稿
      postPromise = postApi
        .create({
          variables: {},
          catchError: true,
          loading: true,
        })
        .then(({ post }) => {
          postData.id = post.id;
          router.replace({ name: 'post-edit', params: { id: post.id } });
          return {
            ...post,
            title: '',
          };
        });
    } else {
      // 获取详情
      postPromise = postApi
        .get({
          variables: {
            id: postData.id,
          },
          catchError: true,
          loading: true,
        })
        .then(({ post }) => {
          if (post) {
            return post;
          } else {
            message.error('内容不存在', () => {
              router.replace({ name: 'posts' });
            });
            return;
          }
        });
    }

    Promise.all([postPromise, designerMixin.getCategories(), designerMixin.getTags(), userManager.getUser()]).then(
      ([post, categoryTreeData, tagSelectData, user]) => {
        if (!post) return;

        const { title, excerpt, content, status, commentStatus, categories, tags, metas } = post;

        // edit modal
        postData.title = title;
        postData.excerpt = excerpt;
        postData.content = content;
        postData.status = status;
        postData.allowComment = commentStatus === TemplateCommentStatus.Open;

        const { framework } = getFrameworkSchema(content);
        schemaFrameworkRef.value = framework;

        // 其它框架
        // if(framework){}

        // feature image
        postData.featureImage = metas?.find(({ key }) => key === PostMetaPresetKeys.FeatureImage)?.value ?? '';

        // template page type
        postData.templatePageType =
          (metas?.find(({ key }) => key === PostMetaPresetKeys.Template)?.value as TemplatePageType) ??
          TemplatePageType.Default;

        // category
        designerMixin.category.treeData = categoryTreeData;
        designerMixin.category.selectKeys = categories.map(({ id, name }) => ({ value: id, label: name }));

        // tag
        designerMixin.tag.selectData = tagSelectData;
        designerMixin.tag.selectKeys = tags.map(({ id }) => id);

        // settings display
        let settingsDisplay;
        if (
          (settingsDisplay = metas?.find(({ key }) => key === PostMetaPresetKeys.SettingsDisplay)?.value) !== void 0
        ) {
          settingsDisplayRef.value = settingsDisplay.split(',');
        }

        // 缓存最新数据
        cachedPostData.value = { ...postData };

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

        if (user?.profile.sub !== post.author?.id) {
          actionCapability.canEdit = actionCapability.canEdit && hasPermission(UserCapability.EditOthersTemplates);

          if (status === TemplateStatus.Private) {
            actionCapability.canDelete = actionCapability.canEdit && hasPermission(UserCapability.EditPrivateTemplates);
          }

          actionCapability.canDelete =
            actionCapability.canDelete && hasPermission(UserCapability.DeleteOthersTemplates);

          if (actionCapability.canDelete && status === TemplateStatus.Private) {
            actionCapability.canDelete =
              actionCapability.canDelete && hasPermission(UserCapability.DeletePrivateTemplates);
          }
        }

        isSelfContentRef.value = user?.profile.sub === String(post.author?.id);

        // cache content when schema framework changed
        watch(schemaFrameworkRef, (value, old) => {
          cacheContentData[old] = postData.content;
          postData.content = cacheContentData[value] || '';
        });

        // save settings to sever
        watch(settingsDisplayRef, (value) => {
          templateApi.updateMetaByKey({
            variables: {
              templateId: postData.id!,
              metaKey: PostMetaPresetKeys.SettingsDisplay,
              metaValue: value.join(','),
              createIfNotExists: true,
            },
          });
        });
      },
    );

    const onSubmit = (status?: TemplateStatus) => {
      const schema: any = postData.content;

      // 其它框架
      // if(contentFrameworkRef.value === ''){}

      return postApi
        .update({
          variables: {
            id: postData.id!,
            updatePost: {
              title: postData.title,
              excerpt: postData.excerpt,
              content: toFrameworkContent(schema, schemaFrameworkRef.value),
              status,
              commentStatus: postData.allowComment ? TemplateCommentStatus.Open : TemplateCommentStatus.Closed,
            },
            featureImage: postData.featureImage,
            template: postData.templatePageType,
          },
          loading: () => {
            actionStatus.processing = true;
            return () => {
              actionStatus.processing = false;
            };
          },
        })
        .then(() => {
          status && (postData.status = status);
          // 缓存最新数据
          cachedPostData.value = { ...postData };
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
      const status = postData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Draft;
      onSubmit(status).finally(() => {
        actionStatus.savingToDarft = false;
      });
    };

    // 从发布状态（包括 private）切换到草稿状态，修改post 并将状态修改为draft
    // 当 status 是 private 时，强制修改成 draft, 显示将会变为public
    const handleSwitchToDraft = () => {
      Modal.confirm({
        content: i18n.tv('page_templates.posts.tips.unpublishe_confirm', '确认是否将已发布内容放入到草稿箱？'),
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
      const status = postData.status === TemplateStatus.Private ? TemplateStatus.Private : TemplateStatus.Publish;
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

    onMounted(() => {
      if (deviceType.isDesktop) {
        siderCollapsedRef.value = false;
      }
    });

    return () => (
      <DesignLayout
        status={postData.status}
        actionStatus={actionStatus}
        actionCapability={actionCapability}
        isSelfContent={isSelfContentRef.value}
        siderCollapsed={siderCollapsedRef.value}
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
                      <p>{i18n.tv('page_templates.posts.design.view', '查看文章')}</p>
                      <a href={`${fixedLinkRef.value}`} class={classes.fixedLink} target="preview">
                        {fixedLinkRef.value}
                        <Icon component={IconLinkExternal} class="ml-1" />
                      </a>
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.Category) && (
                    <Collapse.Panel header={i18n.tv('page_templates.category_label', '分类')}>
                      <TreeSelect
                        value={designerMixin.category.selectKeys}
                        treeData={designerMixin.category.treeData}
                        loadData={designerMixin.loadCategoryData.bind(this)}
                        treeCheckStrictly
                        showSearch
                        treeCheckable
                        treeDataSimpleMode
                        dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
                        placeholder={i18n.tv('page_templates.category_placeholder', '请选择分类(或输入搜索分类)')}
                        onSearch={debounce(designerMixin.handleCategorySearch, 800)}
                        onChange={designerMixin.handleCategoryChange(postData.id!).bind(this)}
                      ></TreeSelect>
                      <router-link to={{ name: 'category' }} class="d-block mt-2">
                        {i18n.tv('page_templates.new_category_link_text', '新建分类')}
                      </router-link>
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.Tag) && (
                    <Collapse.Panel header={i18n.tv('page_templates.tag_label', '标签')}>
                      <Select
                        value={designerMixin.tag.selectKeys}
                        options={designerMixin.tag.selectData}
                        showSearch
                        mode="tags"
                        dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
                        placeholder={i18n.tv('page_templates.tag_placeholder', '请选择标签(或输入标签添加)')}
                        onSelect={designerMixin.handleTagSelect(postData.id!).bind(this)}
                        onDeselect={designerMixin.handleTagDeselect(postData.id!).bind(this)}
                      ></Select>
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.FeatureImage) && (
                    <Collapse.Panel header={i18n.tv('page_templates.feature_image_label', '特色图片')}>
                      <div class={classes.featureImageSelector} onClick={() => (featureImageModalVisible.value = true)}>
                        {postData.featureImage ? (
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
                                vOn:click_prevent_stop={() => (postData.featureImage = '')}
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
                          objectPrefixKey="templates/post_"
                          onSelect={(path, media) => {
                            postData.featureImage = JSON.stringify({
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
                  {settingsDisplayRef.value.includes(Settings.Excerpt) && (
                    <Collapse.Panel header={i18n.tv('page_templates.posts.excerpt_label', '摘要')}>
                      <p>{i18n.tv('page_templates.write_excerpt_label', '撰写摘要（选填）')}</p>
                      <Input.TextArea
                        vModel={postData.excerpt}
                        row="3"
                        placeholder={i18n.tv('page_templates.posts.excerpt_placeholder', '请输入内容简介')}
                      />
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.Comment) && (
                    <Collapse.Panel header={i18n.tv('page_templates.discussion_label', '讨论')}>
                      <Checkbox vModel={postData.allowComment}>
                        {i18n.tv('page_templates.allow_comment_label', '允许评论')}
                      </Checkbox>
                    </Collapse.Panel>
                  )}
                  {settingsDisplayRef.value.includes(Settings.Attribute) && (
                    <Collapse.Panel header={i18n.tv('page_templates.posts.attribute_label', '文章属性')}>
                      <p>{i18n.tv('page_templates.template_label', '模版')}</p>
                      <Select vModel={postData.templatePageType}>
                        <Select.Option value={TemplatePageType.Default}>
                          {i18n.tv('page_templates.template_options.default', '默认模版')}
                        </Select.Option>
                        <Select.Option value={TemplatePageType.Cover}>
                          {i18n.tv('page_templates.template_options.cover', '封面模版')}
                        </Select.Option>
                        <Select.Option value={TemplatePageType.FullWidth}>
                          {i18n.tv('page_templates.template_options.full_width', '全宽模版')}
                        </Select.Option>
                      </Select>
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
            'update:siderCollapsed': (collapsed: boolean) => (siderCollapsedRef.value = collapsed),
          },
        }}
      >
        {schemaFrameworkRef.value === 'HTML' ? (
          <DocumentEditor
            {...{
              attrs: {
                title: postData.title,
                value: postData.content,
                fullwidth: postData.templatePageType === TemplatePageType.FullWidth,
                disabled: actionStatus.processing,
              },
              on: {
                'update:title': (value: string) => {
                  postData.title = value;
                },
                input: (value: string) => {
                  postData.content = value;
                },
              },
            }}
          />
        ) : (
          <div>{`设计器类型"${schemaFrameworkRef.value}"暂不支持`}</div>
        )}
      </DesignLayout>
    );
  },
});

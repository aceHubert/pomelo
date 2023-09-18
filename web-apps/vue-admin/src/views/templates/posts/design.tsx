import { debounce } from 'lodash-es';
import { defineComponent, ref, reactive, watch, onMounted } from '@vue/composition-api';
import { trailingSlash, equals } from '@ace-util/core';
import { useRouter } from 'vue2-helpers/vue-router';
import { Checkbox, Input, Form, Select, TreeSelect, Divider, Collapse, Upload, Icon } from 'ant-design-vue';
import { Modal, message } from '@/components';
import {
  usePostApi,
  useResApi,
  TemplateStatus,
  TemplatePageType,
  TemplateCommentStatus,
  PresetPostMetaKeys,
} from '@/fetch/graphql';
import { useDeviceMixin } from '@/mixins';
import { useI18n, useUserManager, useOptions } from '@/hooks';
import { DesignLayout, DocumentEditor } from '../components';
import { useDesignMixin } from '../mixins/design.mixin';
import classes from './design.module.less';

// Types
import type { PostTemplateModel } from '@/fetch/graphql';
import type { ActionStatus, ActionCapability } from '../components/design-layout/DesignLayout';

export default defineComponent({
  name: 'PostDesign',
  layout: 'blank',
  head() {
    return {
      title: this.$tv('page_templates.posts.design.page_title', '撰写文章') as string,
    };
  },
  beforeRouteLeave(to, from, next) {
    if (this.actionStatus.changed) {
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
    const designMixin = useDesignMixin();
    const deviceMixin = useDeviceMixin();
    const homeUrl = useOptions('home');
    const siteUrl = useOptions('siteurl');
    const postApi = usePostApi();
    const resApi = useResApi();

    // #region data scopes 新增、修改、查询
    const siderCollapsedRef = ref(true);
    let cachedPostData = {};
    const postData = reactive<
      Pick<PostTemplateModel, 'title' | 'excerpt' | 'content' | 'status'> & {
        id?: number;
        fixedLink?: string;
        featureImage?: string;
        allowComment?: boolean;
        templatePageType?: TemplatePageType;
      }
    >({
      id: props.id ? Number(props.id) : void 0,
      title: '',
      excerpt: '',
      content: '',
      status: TemplateStatus.Draft,
      fixedLink: '',
      featureImage: '',
      allowComment: false,
      templatePageType: TemplatePageType.Default,
    });

    const featureImageUploadingRef = ref(false);
    const featureDisplayImageRef = ref('');

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
      operate: false,
      publish: false,
    });

    const isSelfContentRef = ref(false);

    watch(
      postData,
      (value) => {
        actionStatus.changed = !equals(cachedPostData, value);
      },
      { deep: true },
    );

    // ckeditor 配置
    const editorProps = reactive({
      disabled: false,
      config: {},
    });

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
              router.replace({ name: ' posts' });
            });
            return;
          }
        });
    }

    Promise.all([postPromise, designMixin.getCategories(), designMixin.getTags(), userManager.getUser()]).then(
      ([post, categoryTreeData, tagSelectData, user]) => {
        if (!post) return;

        const { title, excerpt, content, status, commentStatus, categories, tags, metas } = post;

        // edit modal
        postData.title = title;
        postData.excerpt = excerpt;
        postData.content = content;
        postData.status = status;
        postData.allowComment = commentStatus === TemplateCommentStatus.Open;

        // fixed link
        const baseUrl = trailingSlash(homeUrl.value);
        postData.fixedLink = baseUrl + `p/${post.id}`;

        // feature image
        postData.featureImage = metas?.find(({ key }) => key === PresetPostMetaKeys.FeatureImage)?.value ?? '';
        featureDisplayImageRef.value = postData.featureImage
          ? trailingSlash(siteUrl.value) +
            (postData.featureImage.startsWith('/') ? postData.featureImage.substring(1) : postData.featureImage)
          : postData.featureImage;

        // template page type
        postData.templatePageType =
          (metas?.find(({ key }) => key === PresetPostMetaKeys.Template)?.value as TemplatePageType) ??
          TemplatePageType.Default;

        // category
        designMixin.category.treeData = categoryTreeData;
        designMixin.category.selectKeys = categories.map(({ id, name }) => ({ value: id, label: name }));

        // tag
        designMixin.tag.selectData = tagSelectData;
        designMixin.tag.selectKeys = tags.map(({ id }) => id);

        // 缓存最新数据
        cachedPostData = { ...postData };

        actionStatus.disabledActions = false;

        // TODO: 设置条件管理员权限
        if (user?.profile.role?.includes('isp.admin')) {
          actionCapability.operate = true;
          actionCapability.publish = true;
        } else {
          // 只能操作自己的
          if (user?.profile.sub === post.author) {
            actionCapability.operate = true;
          }
        }

        isSelfContentRef.value = user?.profile.sub === post.author;
      },
    );

    const onFeatureImageUpload = (file: File) => {
      return resApi
        .uploadFile({
          variables: {
            file,
          },
          loading: () => {
            featureImageUploadingRef.value = true;
            return () => {
              featureImageUploadingRef.value = false;
            };
          },
        })
        .then(({ file }) => {
          postData.featureImage = file.path;
          featureDisplayImageRef.value = file.medium?.fullPath ?? file.fullPath;
        })
        .catch((err) => {
          message.error(`上传失败，${err.message}`);
        });
    };

    const onSubmit = (status?: TemplateStatus) => {
      return postApi
        .update({
          variables: {
            id: postData.id!,
            updatePost: {
              title: postData.title,
              excerpt: postData.excerpt,
              content: postData.content,
              status,
              commentStatus: postData.allowComment ? TemplateCommentStatus.Open : TemplateCommentStatus.Closed,
            },
            featureImage: postData.featureImage,
            template: postData.templatePageType,
          },
          loading: () => {
            actionStatus.processing = true;
            editorProps.disabled = true;
            return () => {
              actionStatus.processing = false;
              editorProps.disabled = false;
            };
          },
        })
        .then(() => {
          status && (postData.status = status);
          // 缓存最新数据
          cachedPostData = { ...postData };
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

    onMounted(() => {
      if (deviceMixin.isDesktop) {
        siderCollapsedRef.value = false;
      }
    });

    return {
      editorProps,
      actionStatus,
      actionCapability,
      isSelfContent: isSelfContentRef,
      siderCollapsed: siderCollapsedRef,
      featureDisplayImage: featureDisplayImageRef,
      featureImageUploading: featureImageUploadingRef,
      postData,
      category: designMixin.category,
      tag: designMixin.tag,
      submiting: designMixin.submitingRef,
      loadCategoryData: designMixin.loadCategoryData,
      handleCategoryChange: designMixin.handleCategoryChange,
      handleCategorySearch: debounce(designMixin.handleCategorySearch, 800),
      handleTagSelect: designMixin.handleTagSelect,
      handleTagDeselect: designMixin.handleTagDeselect,
      onFeatureImageUpload,
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
        status={this.postData.status}
        actionStatus={this.actionStatus}
        actionCapability={this.actionCapability}
        isSelfContent={this.isSelfContent}
        siderCollapsed={this.siderCollapsed}
        {...{
          scopedSlots: {
            siderContent: () => (
              <Form labelAlign="left" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={this.$tv('page_templates.visibility_label', '可见性')} class="px-3">
                  TODO
                </Form.Item>
                <Form.Item label={this.$tv('page_templates.publish_set_label', '发布')} class="px-3">
                  TODO
                </Form.Item>
                <Divider class="my-0" />
                <Collapse
                  bordered={false}
                  activeKey="statusAndVisibility"
                  expand-icon-position="right"
                  class="shades transparent"
                >
                  {this.fixedLink && (
                    <Collapse.Panel header={this.$tv('page_templates.fixed_link_label', '固定链接')}>
                      <p>{this.$tv('page_templates.posts.design.view', '查看文章')}</p>
                      <a href={this.postData.fixedLink} target="preview-route">
                        {this.postData.fixedLink}
                        <Icon type="link" class="ml-1" />
                      </a>
                    </Collapse.Panel>
                  )}
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
                    <router-link to={{ name: 'category' }} class="d-block mt-2">
                      {this.$tv('page_templates.new_category_link_text', '新建分类')}
                    </router-link>
                  </Collapse.Panel>
                  <Collapse.Panel header={this.$tv('page_templates.tag_label', '标签')}>
                    <Select
                      value={this.tag.selectKeys}
                      options={this.tag.selectData}
                      showSearch
                      mode="tags"
                      dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
                      placeholder={this.$tv('page_templates.tag_placeholder', '请选择标签(或输入标签添加)')}
                      onSelect={this.handleTagSelect(this.id!).bind(this)}
                      onDeselect={this.handleTagDeselect(this.id!).bind(this)}
                    ></Select>
                  </Collapse.Panel>
                  <Collapse.Panel header={this.$tv('page_templates.feature_image_label', '特色图片')}>
                    <Upload
                      name="feature-image"
                      listType="picture-card"
                      class={classes.featureImageUploader}
                      accept="image/png, image/jpeg"
                      showUploadList={false}
                      action={(file) => this.onFeatureImageUpload(file)}
                    >
                      {this.featureDisplayImage ? (
                        <img
                          src={this.featureDisplayImage}
                          alt="feature-image"
                          style="object-fit: contain; width: 100%; max-height: 120px;"
                        />
                      ) : (
                        <div>
                          <Icon type={this.featureImageUploading ? 'loading' : 'plus'} />
                          <div class="text--secondary">
                            {this.$tv('page_templates.upload_feature_image_label', '设置特色图片')}
                          </div>
                        </div>
                      )}
                    </Upload>
                  </Collapse.Panel>
                  <Collapse.Panel header={this.$tv('page_templates.posts.excerpt_label', '摘要')}>
                    <p>{this.$tv('page_templates.write_excerpt_label', '撰写摘要（选填）')}</p>
                    <Input.TextArea
                      row="3"
                      placeholder={this.$tv('page_templates.posts.excerpt_placeholder', '请输入内容简介')}
                      vModel={this.postData.excerpt}
                    />
                  </Collapse.Panel>
                  <Collapse.Panel header={this.$tv('page_templates.discussion_label', '讨论')}>
                    <Checkbox vModel={this.postData.allowComment}>
                      {this.$tv('page_templates.allow_comment_label', '允许评论')}
                    </Checkbox>
                  </Collapse.Panel>
                  <Collapse.Panel header={this.$tv('page_templates.attribute_label', '文章属性')}>
                    <p>{this.$tv('page_templates.template_label', '模版')}</p>
                    <Select vModel={this.postData.templatePageType}>
                      <Select.Option value={TemplatePageType.Default}>
                        {this.$tv('page_templates.template_options.default', '默认模版')}
                      </Select.Option>
                      <Select.Option value={TemplatePageType.Cover}>
                        {this.$tv('page_templates.template_options.cover', '封面模版')}
                      </Select.Option>
                      <Select.Option value={TemplatePageType.FullWidth}>
                        {this.$tv('page_templates.template_options.full_width', '全宽模版')}
                      </Select.Option>
                    </Select>
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
            'update:siderCollapsed': (collapsed: boolean) => (this.siderCollapsed = collapsed),
          },
        }}
      >
        <DocumentEditor
          {...{
            props: {
              title: this.postData.title,
              value: this.postData.content,
              locale: this.$i18n.locale,
            },
            attrs: this.editorProps,
            on: {
              'update:title': (value: string) => {
                this.postData.title = value;
              },
              input: (value: string) => {
                this.postData.content = value;
              },
            },
          }}
        />
      </DesignLayout>
    );
  },
});

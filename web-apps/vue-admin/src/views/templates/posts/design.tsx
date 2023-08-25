import { debounce } from 'lodash-es';
import { defineComponent, computed, ref, reactive, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Input, Form, Select, TreeSelect, Divider, Collapse } from 'ant-design-vue';
import { Modal, message, getObsDisplayUrl } from '@/components';
import { usePostApi, useResApi, formatError, TemplateStatus } from '@/fetch/graphql';
import { useI18n, useUserManager } from '@/hooks';
import { DesignLayout, DocumentEditor } from '../components';
import { useDesignMixin } from '../mixins/design.mixin';

// Types
import type { NewPostTemplateInput, UpdatePostTemplateInput } from '@/fetch/graphql';
import type { ActionStatus, ActionCapability } from '../components/design-layout/DesignLayout';

export default defineComponent({
  name: 'PostDesign',
  head() {
    return {
      title: this.$tv('page_templates.posts.design.page_title', '内容设计') as string,
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
    id: { type: String },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();
    const userManager = useUserManager();
    const postApi = usePostApi();
    const resApi = useResApi();
    const designMixin = useDesignMixin();

    // #region data scopes 新增、修改、查询
    const isAddMode = computed(() => route.name === 'post-add');
    const siderCollapsedRef = ref(true);
    const titleRef = ref('');
    const excerptRef = ref('');
    const contentRef = ref('');
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
      disabledActions: isAddMode.value,
    });

    const actionCapability = reactive<Required<ActionCapability>>({
      operate: false,
      publish: false,
    });

    const isSelfContentRef = ref(false);

    // ckeditor 配置
    const editorProps = reactive({
      disabled: false,
      config: {
        obsUpload: {
          options: async (file: File) => {
            const suffix = file.name.substring(file.name.lastIndexOf('.'));
            const fileName = Math.random().toString(16).substring(2) + suffix;
            const objectKey = `temp/post_${fileName}`;
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
            return {
              displayUrl: getObsDisplayUrl(objectKey),
              uploadAction: url,
              method: 'PUT',
              headers,
            };
          },
        },
      },
    });

    const getPostDetail = async (id: string) => {
      const { post } = await postApi.get({
        variables: {
          id,
        },
        catchError: true,
        loading: true,
      });

      if (post) {
        const { title, excerpt, content, status, categories, tags } = post;

        // edit modal
        titleRef.value = title;
        excerptRef.value = excerpt;
        contentRef.value = content;

        // status
        statusRef.value = status;

        // category
        designMixin.getCategories().then((treeData) => {
          designMixin.category.treeData = treeData;
          designMixin.category.selectKeys = categories.map(({ id, name }) => ({ value: id, label: name }));
        });

        // tag
        designMixin.getTags().then((selectData) => {
          designMixin.tag.selectData = selectData;
          designMixin.tag.selectKeys = tags.map(({ id }) => id);
        });

        return post;
      } else {
        message.error({
          content: '内容不存在',
          onClose: () => {
            router.replace({ name: ' posts' });
          },
        });
        return;
      }
    };

    watch(
      () => props.id,
      async (id) => {
        const user = await userManager.getUser();
        if (!isAddMode.value) {
          const post = await getPostDetail(id!);
          if (post) {
            // TODO: 设置条件管理员权限
            if (user!.profile.role?.includes('isp.admin')) {
              actionCapability.operate = true;
              actionCapability.publish = true;
            } else {
              // 只能操作自己的
              if (user?.profile.sub === post.author) {
                actionCapability.operate = true;
              }
            }

            isSelfContentRef.value = user?.profile.sub === post.author;
          }
        } else {
          actionCapability.operate = true;
          // TODO: 设置条件管理员权限
          if (user!.profile.role?.includes('isp.admin')) {
            actionCapability.publish = true;
          }
        }
      },
      {
        immediate: true,
      },
    );

    const createPost = (input: NewPostTemplateInput) => {
      return postApi
        .create({
          variables: {
            newPostTemplate: input,
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
        .then(({ post: { id } }) => {
          input.status && (statusRef.value = input.status);
          actionStatus.changed = false;
          router.replace({ name: 'post-edit', params: { id: String(id) } }).then(() => {
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

    const updatePost = (input: UpdatePostTemplateInput) => {
      return postApi
        .update({
          variables: {
            id: props.id!,
            updatePost: input,
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
          input.status && (statusRef.value = input.status);
          actionStatus.changed = false;
        })
        .catch((err) => {
          err = formatError(err);
          message.error(`修改失败，${err.message}`);
        });
    };

    const onSubmit = async (status?: TemplateStatus) => {
      if (!titleRef.value.trim()) {
        message.error(i18n.tv('page_templates.title_required', '标题必填！') as string);
        siderCollapsedRef.value = false;
        return;
      }
      if (isAddMode.value) {
        await createPost({
          title: titleRef.value,
          excerpt: excerptRef.value,
          content: contentRef.value,
          status: status || TemplateStatus.Draft,
        });
      } else {
        await updatePost({ title: titleRef.value, excerpt: excerptRef.value, content: contentRef.value, status });
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
      editorProps,
      actionStatus,
      actionCapability,
      isSelfContent: isSelfContentRef,
      isAddMode,
      siderCollapsed: siderCollapsedRef,
      title: titleRef,
      excerpt: excerptRef,
      content: contentRef,
      status: statusRef,
      category: designMixin.category,
      tag: designMixin.tag,
      submiting: designMixin.submitingRef,
      loadCategoryData: designMixin.loadCategoryData,
      handleCategoryChange: designMixin.handleCategoryChange,
      handleCategorySearch: debounce(designMixin.handleCategorySearch, 800),
      handleTagSelect: designMixin.handleTagSelect,
      handleTagDeselect: designMixin.handleTagDeselect,
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
        siderCollapsed={this.siderCollapsed}
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
                <Form.Item label={this.$tv('page_templates.posts.excerpt_label', '简介')} class="px-3">
                  <Input.TextArea
                    row="2"
                    placeholder={this.$tv('page_templates.posts.excerpt_placeholder', '请输入内容简介')}
                    value={this.excerpt}
                    onInput={(e: any) => {
                      this.excerpt = e.target.value;
                      this.actionStatus.changed = true;
                    }}
                  />
                </Form.Item>
                <Divider class="my-0" />
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
                  {!this.isAddMode && (
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
            'update:siderCollapsed': (collapsed: boolean) => (this.siderCollapsed = collapsed),
          },
        }}
      >
        <DocumentEditor
          {...{
            props: {
              title: this.title,
              value: this.content,
              locale: this.$i18n.locale,
            },
            attrs: this.editorProps,
            on: {
              'update:title': (value: string) => {
                // 新增必须要有标题和内容
                if (this.isAddMode) {
                  this.actionStatus.disabledActions = !(Boolean(value) && Boolean(this.content));
                }
                this.actionStatus.changed = true;
                this.title = value;
              },
              input: (value: string) => {
                // 新增必须要有标题和内容
                if (this.isAddMode) {
                  this.actionStatus.disabledActions = !(Boolean(value) && Boolean(this.title));
                }
                // value赋值也会造成 input
                this.content !== value && (this.actionStatus.changed = true);
                this.content = value;
              },
            },
          }}
        />
      </DesignLayout>
    );
  },
});

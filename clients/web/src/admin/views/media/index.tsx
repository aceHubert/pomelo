import moment from 'moment';
import { computed, defineComponent, ref } from '@vue/composition-api';
import { Icon, Spin, Drawer, Descriptions, Upload } from 'ant-design-vue';
import { createResource } from '@vue-async/resource-manager';
import { useRoute } from 'vue2-helpers/vue-router';
import { message } from '@/components';
import { useI18n } from '@/composables';
import { useUploadMixin, useLocationMixin } from '@/mixins';
import { useResApi } from '@/fetch/apis';
import FileUnknownSvg from '@admin/assets/icons/file-unknown-fill.svg';
import { MediaList } from './components';
import { formatFileSize } from './utils/format';
import classes from './index.module.less';

// Types
import type { Media } from '@/fetch/apis';

export default defineComponent({
  name: 'Media',
  head() {
    return {
      title: this.$tv('page_media.page_title', '媒体库') as string,
    };
  },
  setup(_, { refs }) {
    const route = useRoute();
    const i18n = useI18n();
    const localtionMixin = useLocationMixin();
    const uploadMixin = useUploadMixin();
    const resApi = useResApi();

    const searchQuery = computed(() => {
      return {
        keyword: route.query.keyword as string,
        offset: route.query.offset ? Number(route.query.offset) : 0,
        limit: route.query.limit ? Number(route.query.limit) : 20,
      };
    });

    const drawerVisible = ref(false);
    const $mediaRes = createResource((id: string) =>
      resApi
        .get({
          variables: { id },
        })
        .then(({ media }) => media),
    );

    const handleCustomUpload = uploadMixin.getUploadRequest();

    return () => {
      const { $loading: loading, $result: media } = $mediaRes;
      return (
        <div class={[classes.container]}>
          <Upload.Dragger
            multiple
            showUploadList={false}
            disabled={!!uploadMixin.uploading}
            method="PUT"
            customRequest={(options) => handleCustomUpload(options)}
            onChange={({ file: { uid, name, originFileObj, type, size, status, response, error }, event }) => {
              if (status === 'uploading') {
                const { loaded = 0, total = size } = event ?? {};
                (refs['mediaList'] as any).addItem({
                  uid,
                  filename: name,
                  path: /^image\//i.test(type) ? URL.createObjectURL(originFileObj) : FileUnknownSvg,
                  percent: Math.floor((loaded / total) * 100),
                });
              } else {
                if (status === 'done') {
                  (refs['mediaList'] as any).addItem({ ...response, uid });
                } else if (status === 'error') {
                  (refs['mediaList'] as any).removeItem(uid);
                  message.error(
                    error?.message ||
                      (i18n.tv('page_media.upload_error', `文件"${name}"上传失败！`, {
                        name,
                      }) as string),
                  );
                }
              }
            }}
          >
            <p class="primary--text">
              <Icon type="upload" class="font-size-lg--3x" />
            </p>
            <p class="mt-4 text--primary">
              {i18n.tv('page_media.upload_dragger_btn_text', '点击或拖拽至此上传媒体文件')}
            </p>
            <p class="mt-2 text--secondary">
              {i18n.tv('page_media.upload_multiple_btn_tips', '支持单个或批量媒体文件上传。')}
            </p>
            {/* TODO: 上传进度 */}
          </Upload.Dragger>
          <MediaList
            ref="mediaList"
            class="mt-3"
            keyword={searchQuery.value.keyword}
            page={searchQuery.value.offset / searchQuery.value.limit + 1}
            pageSize={searchQuery.value.limit}
            showUploader={false}
            onItemClick={(media: Media) => {
              drawerVisible.value = true;
              $mediaRes.read(media.id);
            }}
            onSearch={(val) => {
              if (searchQuery.value.keyword !== val) {
                localtionMixin.updateRouteQuery({
                  keyword: val,
                });
              }
            }}
            onPageChange={(page, pageSize) => {
              const offset = (page - 1) * pageSize;
              const limit = pageSize;
              if (searchQuery.value.offset !== offset || searchQuery.value.limit !== limit) {
                localtionMixin.updateRouteQuery({
                  offset: String(offset),
                  limit: String(limit),
                });
              }
            }}
          ></MediaList>
          <Drawer
            visible={drawerVisible.value}
            title={i18n.tv('page_media.file_description', '详细信息')}
            wrapClassName={classes.drawer}
            placement="right"
            width={300}
            onClose={() => (drawerVisible.value = false)}
          >
            {loading ? (
              <div class="text-center">
                <Spin />
              </div>
            ) : (
              media && (
                <Descriptions column={1} size="small" layout="vertical">
                  <Descriptions.Item label={i18n.tv('page_media.file_name', '文件名')}>
                    {media.originalFileName + media.extension}
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.mime_type', '媒体类型')}>
                    <span class="text-ellipsis" title={media.mimeType}>
                      {media.mimeType}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.file_size', '媒体大小')}>
                    {formatFileSize(media.fileSize)}
                  </Descriptions.Item>
                  {media.width && (
                    <Descriptions.Item label={i18n.tv('page_media.image_width', '图片宽度')}>
                      {media.width}px
                    </Descriptions.Item>
                  )}
                  {media.height && (
                    <Descriptions.Item label={i18n.tv('page_media.image_height', '图片高度')}>
                      {media.height}px
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label={i18n.tv('page_media.full_path', '媒体地址')}>
                    <a href={media.fullPath} title={media.path} target="_blank">
                      {media.path}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.created_at', '创建时间')}>
                    {moment(media.createdAt).locale(i18n.locale).format('L HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              )
            )}
          </Drawer>
        </div>
      );
    };
  },
});

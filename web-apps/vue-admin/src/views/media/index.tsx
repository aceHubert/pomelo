import moment from 'moment';
import { computed, defineComponent, ref } from '@vue/composition-api';
import { Icon, Progress, Spin, Drawer, Descriptions, Upload } from 'ant-design-vue';
import { createResource } from '@vue-async/resource-manager';
import { useRoute } from 'vue2-helpers/vue-router';
import { message } from '@/components';
import { useI18n } from '@/hooks';
import { useLocationMixin } from '@/mixins';
import { useResApi } from '@/fetch/graphql';
import { MediaList } from './components/media-list';
import classes from './index.module.less';

export default defineComponent({
  name: 'Media',
  head() {
    return {
      title: this.$tv('page_media.title', '所有媒体') as string,
    };
  },
  setup() {
    const route = useRoute();
    const i18n = useI18n();
    const localtionMixin = useLocationMixin();
    const resApi = useResApi();

    const searchQuery = computed(() => {
      return {
        keyword: route.query.keyword as string,
        offset: route.query.offset ? Number(route.query.offset) : 0,
        limit: route.query.limit ? Number(route.query.limit) : 20,
      };
    });

    const onLoadMedias = (page: number, pageSize: number) => {
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
      if (searchQuery.value.offset !== offset || searchQuery.value.limit !== limit) {
        localtionMixin.updateRouteQuery({
          offset: String(offset),
          limit: String(limit),
        });
      }
      return resApi
        .getPaged({
          variables: {
            ...searchQuery.value,
            offset: (page - 1) * pageSize,
            limit: pageSize,
          },
        })
        .then(({ medias }) => medias);
    };

    const drawerVisible = ref(false);
    const $mediaRes = createResource((id: number) =>
      resApi
        .get({
          variables: {
            id,
          },
        })
        .then(({ media }) => media),
    );

    const uploadProcessData = ref<[number, number][]>([]);
    const uploadProgress = computed(() => {
      if (uploadProcessData.value.length === 0) {
        return 0;
      }
      const sum = uploadProcessData.value.reduce((a, b) => a + b[0], 0);
      const total = uploadProcessData.value.reduce((a, b) => a + b[1], 0);
      return Math.floor((sum / total) * 100);
    });
    const handleUpload = (
      file: File,
      options: {
        onSuccess?: (res: any) => void;
        onError?: (err: any) => void;
        onProgress?: (event: { percent: number }) => void;
      },
    ) => {
      const progress: [number, number] = [0, file.size];
      uploadProcessData.value.push(progress);
      resApi
        .uploadFile({
          variables: {
            file,
          },
          context: {
            fetchOptions: {
              onProgress: (ev: ProgressEvent) => {
                progress[0] = ev.loaded;
                options.onProgress?.({ percent: (ev.loaded / ev.total) * 100 });
              },
            },
          },
        })
        .then(({ file }) => {
          options.onSuccess?.(file);
          // const table = $mediasRes.$result;
          // if (table?.rows) {
          //   // 如果当前页面包含已存在的文件，移除
          //   table.rows.splice(
          //     table.rows.findIndex((row) => file.fileName === row.fileName),
          //     1,
          //   );
          //   // 插入到第一个
          //   table.rows.unshift(file);
          // } else {
          //   $mediasRes.read(searchQuery.value);
          // }
        })
        .catch((err) => {
          options.onError?.(err);
          message.error(err.message);
        })
        .finally(() => {
          uploadProcessData.value.splice(uploadProcessData.value.indexOf(progress), 1);
        });
    };

    return () => {
      const { $loading: loading, $result: media } = $mediaRes;
      return (
        <div class={[classes.container]}>
          <Upload.Dragger
            multiple
            showUploadList={false}
            disabled={!!uploadProcessData.value.length}
            customRequest={({ file, onSuccess, onError, onProgress }) =>
              handleUpload(file, { onSuccess, onError, onProgress })
            }
          >
            {uploadProgress.value > 0 && uploadProgress.value < 100 ? (
              <Progress type="circle" percent={uploadProgress.value} width={80} />
            ) : (
              <p class="primary--text">
                <Icon type="upload" style="font-size: 48px" />
              </p>
            )}
            <p class="mt-4 text--primary"> {i18n.tv('page_media.upload_btn_text', '点击或拖拽至此上传媒体文件')}</p>
            <p class="mt-2 text--secondary">{i18n.tv('page_media.upload_btn_tips', '支持单个或批量媒体文件上传。')}</p>
          </Upload.Dragger>
          <MediaList
            page={searchQuery.value.offset / searchQuery.value.limit + 1}
            pageSize={searchQuery.value.limit}
            dataSource={onLoadMedias}
            onItemClick={(media) => {
              drawerVisible.value = true;
              $mediaRes.read(media.id);
            }}
          ></MediaList>
          <Drawer
            visible={drawerVisible.value}
            title={i18n.tv('page_media.file_description', '详细信息')}
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
                    <span class="text-ellipsis" title={media.originalFileName + media.extension}>
                      {media.originalFileName + media.extension}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.mime_type', '媒体类型')}>
                    <span class="text-ellipsis" title={media.mimeType}>
                      {media.mimeType}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.file_size', '媒体大小')}>
                    {media.fileSize}KB
                  </Descriptions.Item>
                  <Descriptions.Item label={i18n.tv('page_media.full_path', '媒体地址')}>
                    <a href={media.fullPath} title={`/uploads${media.path}`} target="_blank" class="text-ellipsis">
                      {`/uploads${media.path}`}
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

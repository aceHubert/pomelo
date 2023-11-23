import { defineComponent, getCurrentInstance, reactive, ref } from '@vue/composition-api';
import { expose, useConfigProvider, useEffect } from 'antdv-layout-pro/shared';
import { Input, Button, Space, Radio, Icon, Spin, Progress, Card, Upload, Pagination, Empty } from 'ant-design-vue';
import { Cropper } from 'vue-advanced-cropper';
import { createResource } from '@vue-async/resource-manager';
import { message, Modal } from '@/components';
import { useI18n } from '@/hooks';
import { useResApi } from '@/fetch/apis';
import FileUnknownSvg from '@/assets/icons/file-unknown-fill.svg';
import { useUpload } from '@/mixins';
import { formatFileSize } from '../../utils/format';
import './index.less';

// Types
import type { OmitVue } from 'antdv-layout-pro/types';
import type { Pagination as PaginationProps } from 'ant-design-vue/types/pagination';
import type { Media } from '@/fetch/apis';

export interface MediaListProps {
  keyword?: string;
  accept?: string;
  size: 'default' | 'small';
  page?: number;
  pageSize?: number;
  showSizeChanger?: boolean;
  showUploader?: boolean;
  selectable: boolean;
  cropBeforeUpload: boolean;
  objectPrefixKey?: string;
  prefixCls?: string;
}

export default defineComponent({
  name: 'MediaList',
  props: {
    keyword: String,
    accept: String,
    size: { type: String, default: 'default', validator: (val: string) => ['default', 'small'].includes(val) },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    showSizeChanger: { type: Boolean, default: true },
    showUploader: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    cropBeforeUpload: { type: Boolean, default: true },
    objectPrefixKey: String,
    prefixCls: String,
  },
  emits: ['itemClick', 'pageChange', 'search'],
  setup(props: MediaListProps, { emit }) {
    const currentInstance = getCurrentInstance();
    const configProvider = useConfigProvider();
    const i18n = useI18n();
    const uploadMixin = useUpload();
    const resApi = useResApi();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('media-list', customizePrefixCls);

    const keyword = ref(props.keyword);
    const $mediasRes = createResource((page: number, pageSize: number, keyword?: string) => {
      return resApi
        .getPaged({
          variables: {
            keyword,
            mimeTypes: props.accept?.split(','),
            offset: (page - 1) * pageSize,
            limit: pageSize,
          },
        })
        .then(({ medias }) => medias)
        .catch((err) => {
          message.error(err.message);
        });
    });

    const localPagination = ref<OmitVue<PaginationProps>>({
      size: 'small',
      hideOnSinglePage: true,
    });

    useEffect(() => {
      localPagination.value = {
        ...localPagination.value,
        current: props.page,
        pageSize: props.pageSize,
        showSizeChanger: props.showSizeChanger,
      };
    }, [() => props.page, () => props.pageSize, () => props.showSizeChanger]);

    useEffect(() => {
      $mediasRes.read(localPagination.value.current!, localPagination.value.pageSize!, keyword.value);
    }, [keyword, () => localPagination.value.current, () => localPagination.value.pageSize]);

    const addItem = (file: Media) => {
      const { $result: medias } = $mediasRes;
      if (!medias) return;

      // 如果当前页面包含已存在的文件，移除
      const existsIndex = medias.rows.findIndex((row) => file.fileName === row.fileName);
      existsIndex >= 0 && medias.rows.splice(existsIndex, 1);

      // 插入到第一个
      medias.rows.unshift(file);
    };

    const refresh = (force = false) => {
      force && (localPagination.value = Object.assign({}, localPagination.value, { current: 1 }));
      $mediasRes.read(localPagination.value.current!, localPagination.value.pageSize!);
    };

    const previewImage = reactive({
      modalVisible: false,
      media: null as Media | null,
    });

    const cropImage = reactive({
      path: '',
      resultImage: '',
      coordinates: { width: 0, height: 0, left: 0, top: 0 },
    });

    const createCropContent = () => (
      <div class={`${prefixCls}-crop`}>
        <Cropper
          src={cropImage.path}
          onChange={({ coordinates, canvas }) => {
            cropImage.coordinates = coordinates;
            cropImage.resultImage = canvas.toDataURL();
          }}
        ></Cropper>
        {cropImage.resultImage && (
          <div class={`${prefixCls}-crop-results`}>
            <div class={`${prefixCls}-crop-results__wrapper`}>
              <div class={`${prefixCls}-crop-results__coordinates`}>
                <p class="font-weight-bold mb-1">{i18n.tv('page_media.image_crop.result_title', '结果')}:</p>
                <p class="mb-1">{`${i18n.tv('page_media.image_crop.result_left', '左')}: ${
                  cropImage.coordinates.left
                }`}</p>
                <p class="mb-1">{`${i18n.tv('page_media.image_crop.result_top', '上')}: ${
                  cropImage.coordinates.top
                }`}</p>
                <p class="mb-1">{`${i18n.tv('page_media.image_crop.result_width', '宽度')}: ${
                  cropImage.coordinates.width
                }`}</p>
                <p class="mb-1">{`${i18n.tv('page_media.image_crop.result_height', '高度')}: ${
                  cropImage.coordinates.height
                }`}</p>
              </div>
              <div class={`${prefixCls}-crop-results__preview`}>
                <img src={cropImage.resultImage} />
              </div>
            </div>
          </div>
        )}
      </div>
    );

    const cropImageReplace = ref(false);
    const handleCropImage = (media: Media) => {
      cropImage.path = media.fullPath;
      cropImageReplace.value = false;
      Modal.confirm({
        icon: ' ',
        content: createCropContent,
        width: 798,
        cancelText: i18n.tv('common.btn_text.close', '关闭') as string,
        okText: i18n.tv('common.btn_text.crop', '裁切') as string,
        onOk: () => {
          return new Promise((resolve, reject) => {
            Modal.confirm({
              icon: ' ',
              content: () => (
                <Radio.Group
                  name="crop-replace"
                  vModel={cropImageReplace.value}
                  options={[
                    { label: i18n.tv('page_media.image_crop.replace_false', '创建新媒体文件'), value: false },
                    { label: i18n.tv('page_media.image_crop.replace_true', '替换原始文件'), value: true },
                  ]}
                ></Radio.Group>
              ),
              parentContext: currentInstance?.proxy,
              onCancel: () => {
                reject();
              },
              onOk: () => {
                resApi
                  .cropImage({
                    variables: {
                      id: media.id,
                      options: {
                        ...cropImage.coordinates,
                        replace: cropImageReplace.value,
                      },
                    },
                  })
                  .then(({ image }) => {
                    if (cropImageReplace.value) {
                      const existsIndex = $mediasRes.$result?.rows.findIndex((row) => media.id === row.id) ?? -1;
                      existsIndex >= 0 && $mediasRes.$result?.rows?.splice(existsIndex, 1, image);
                    } else {
                      $mediasRes.$result?.rows?.unshift(image);
                    }
                    resolve(null);
                  })
                  .catch((err) => {
                    message.error(err.message);
                    reject();
                  });
              },
            });
          });
        },
      });
    };

    const uploadCropSkip = ref(false);
    const handleBeforeUpload = (file: File): Promise<Blob | File> => {
      return new Promise((resolve) => {
        if (props.cropBeforeUpload) {
          cropImage.path = URL.createObjectURL(file);
          uploadCropSkip.value = false;
          Modal.confirm({
            icon: ' ',
            content: createCropContent,
            width: 798,
            cancelText: i18n.tv('common.btn_text.skip', '跳过') as string,
            okText: i18n.tv('common.btn_text.crop', '裁切') as string,
            onCancel: () => {
              uploadCropSkip.value = true;
              resolve(file);
            },
            onOk: () => {
              resolve(file);
            },
          });
        } else {
          resolve(file);
        }
      });
    };

    const handleCustomUpload = uploadMixin.getCustomUploadRequest(props.objectPrefixKey);

    const selectedPath = ref('');
    const handleSelect = (media: Media) => {
      if (media.thumbnail || media.scaled || media.medium || media.mediumLarge || media.large) {
        selectedPath.value = media.fullPath;
        Modal.confirm({
          icon: ' ',
          content: () => (
            <Radio.Group
              name="image-select"
              vModel={selectedPath.value}
              options={[
                {
                  label: `${i18n.tv('page_media.select_image.original', '原图')}(${media.width}px * ${media.height}px)`,
                  value: media.fullPath,
                },
                media.thumbnail && {
                  label: `${i18n.tv('page_media.select_image.thumbnail', '缩略图')}(${media.thumbnail.width}px * ${
                    media.thumbnail.height
                  }px)`,
                  value: media.thumbnail.fullPath,
                },
                media.scaled && {
                  label: `${i18n.tv('page_media.select_image.scaled', '缩放图')}(${media.scaled.width}px * ${
                    media.scaled.height
                  }px)`,
                  value: media.scaled.fullPath,
                },
                media.medium && {
                  label: `${i18n.tv('page_media.select_image.medium', '中等图')}(${media.medium.width}px * ${
                    media.medium.height
                  }px)`,
                  value: media.medium.fullPath,
                },
                media.mediumLarge && {
                  label: `${i18n.tv('page_media.select_image.medium_large', '中等大图')}(${
                    media.mediumLarge.width
                  }px * ${media.mediumLarge.height}px)`,
                  value: media.mediumLarge.fullPath,
                },
                media.large && {
                  label: `${i18n.tv('page_media.select_image.large', '大图')}(${media.large.width}px * ${
                    media.large.height
                  }px)`,
                  value: media.large.fullPath,
                },
              ].filter(Boolean)}
            ></Radio.Group>
          ),
          parentContext: currentInstance?.proxy,
          okText: i18n.tv('common.btn_text.select', '选择') as string,
          onOk: () => {
            emit('select', selectedPath.value);
          },
        });
      } else {
        emit('select', media.fullPath);
      }
    };

    expose({
      addItem,
      refresh,
    });

    return () => {
      const { $loading: loading, $result: medias } = $mediasRes;
      return (
        <Spin spinning={loading} delay={260}>
          <div>
            <Input.Search
              style="width: 220px;"
              defaultValue={keyword.value}
              placeholder={i18n.tv('page_media.search_placeholder', '输入"文件名"搜索')}
              onSearch={(val) => {
                keyword.value = val;
                refresh(true);
                emit('search', val);
              }}
            />
          </div>
          <div class={['mt-3', prefixCls, `${prefixCls}--${props.size}`]}>
            {props.showUploader && (
              <div class={`${prefixCls}-item`}>
                <Upload
                  name="new-file"
                  listType="picture-card"
                  class={`${prefixCls}-new-file-uploader`}
                  showUploadList={false}
                  disabled={uploadMixin.uploading}
                  accept={props.accept}
                  method="PUT"
                  customRequest={(options: any) =>
                    handleCustomUpload({
                      ...options,
                      fileOptions: uploadCropSkip.value ? {} : { crop: cropImage.coordinates },
                    })
                  }
                  beforeUpload={(file: File) => handleBeforeUpload(file)}
                  onChange={({ file: { status, response } }) => {
                    if (status === 'done') {
                      addItem(response);
                    } else if (status === 'error') {
                      message.error(i18n.tv('page_media.upload_error', '上传失败！') as string);
                    }
                  }}
                >
                  <div class={`${prefixCls}-new-file-add`}>
                    {uploadMixin.uploadProgress > 0 && uploadMixin.uploadProgress < 100 ? (
                      <Progress type="circle" percent={uploadMixin.uploadProgress} width={80} />
                    ) : (
                      <p class="primary--text">
                        <Icon type="upload" style="font-size: 48px" />
                      </p>
                    )}
                    <p class="mt-4 text--primary">{i18n.tv('page_media.upload_btn_text', '点击上传媒体文件')}</p>
                  </div>
                </Upload>
              </div>
            )}
            {medias?.rows.length ? (
              medias.rows.map((media) => (
                <div class={`${prefixCls}-item`} onClick={() => emit('itemClick', media)}>
                  <Card hoverable size="small">
                    <img
                      slot="cover"
                      class={`${prefixCls}-item__cover`}
                      alt="example"
                      src={media.thumbnail?.fullPath ?? FileUnknownSvg}
                    />
                    <p class="mb-0 text-ellipsis">{`${media.originalFileName}${media.extension}`}</p>
                  </Card>
                  <Space class={`${prefixCls}-item__actions`} direction="vertical">
                    {media.thumbnail && (
                      <Button
                        shape="round"
                        size={props.size}
                        icon="edit"
                        vOn:click_prevent_stop={() => handleCropImage(media)}
                      >
                        {i18n.tv('common.btn_text.edit', '编辑')}
                      </Button>
                    )}
                    {media.thumbnail && (
                      <Button
                        shape="round"
                        size={props.size}
                        icon="eye"
                        vOn:click_prevent_stop={() => {
                          previewImage.media = media;
                          previewImage.modalVisible = true;
                        }}
                      >
                        {i18n.tv('common.btn_text.preview', '预览')}
                      </Button>
                    )}
                    {props.selectable && (
                      <Button
                        shape="round"
                        size={props.size}
                        icon="select"
                        vOn:click_prevent_stop={() => handleSelect(media)}
                      >
                        {i18n.tv('common.btn_text.select', '选择')}
                      </Button>
                    )}
                  </Space>
                </div>
              ))
            ) : !props.showUploader ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={i18n.tv('page_media.empty_list_description', '没有媒体文件！')}
                class="mx-auto"
              />
            ) : null}
          </div>
          <div class="text-right mt-2">
            <Pagination
              props={{
                ...localPagination.value,
                total: medias?.total || 0,
              }}
              onChange={(page, pageSize) => {
                localPagination.value.current = page;
                localPagination.value.pageSize = pageSize;
                emit('pageChange', page, pageSize);
              }}
              onShowSizeChange={(current, pageSize) => {
                localPagination.value.current = current;
                localPagination.value.pageSize = pageSize;
                emit('pageChange', current, pageSize);
              }}
            />
          </div>
          <Modal
            visible={previewImage.modalVisible}
            width={
              (previewImage.media?.width ?? 0) < 300
                ? 300
                : (previewImage.media?.width ?? 0) > 750
                ? 750
                : previewImage.media?.width ?? 520
            }
            bodyStyle={{ textAlign: 'center' }}
            maskClosable={false}
            footer={null}
            onCancel={() => (previewImage.modalVisible = false)}
          >
            <span
              slot="title"
              class="text-ellipsis d-inline-block"
              style="max-width: 80%;"
            >{`${previewImage.media?.originalFileName}${previewImage.media?.extension}`}</span>
            <img alt="example" style="max-width: 100%;" src={previewImage.media?.fullPath} />
            <p class="mt-2 mb-0 text--secondary font-size-xs">{`${formatFileSize(previewImage.media?.fileSize ?? 0)}, ${
              previewImage.media?.width
            }px * ${previewImage.media?.height}px`}</p>
          </Modal>
        </Spin>
      );
    };
  },
});

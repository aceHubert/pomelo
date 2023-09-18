import { defineComponent, ref } from '@vue/composition-api';
import { expose, useConfigProvider, useEffect } from 'antdv-layout-pro/shared';
import { Spin, Card, Pagination } from 'ant-design-vue';
import { createResource } from '@vue-async/resource-manager';
import FileUnknownSvg from '@/assets/icons/file-unknown-fill.svg';
import './index.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { OmitVue } from 'antdv-layout-pro/types';
import type { Pagination as PaginationProps } from 'ant-design-vue/types/pagination';
import type { PagedMedia } from '@/fetch/graphql';

export interface MediaListProps {
  page?: number;
  pageSize?: number;
  showSizeChanger?: boolean;
  dataSource?: PagedMedia | ((page, pageSize) => Promise<PagedMedia>);
  prefixCls?: string;
}

export default defineComponent({
  name: 'MediaList',
  props: {
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    showSizeChanger: { type: Boolean, default: true },
    dataSource: { type: [Array, Function] as PropType<MediaListProps['dataSource']>, default: () => [] },
    prefixCls: String,
  },
  emits: ['itemClick', 'pageChange'],
  setup(props: MediaListProps, { emit }) {
    const configProvider = useConfigProvider();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('media-list', customizePrefixCls);

    const $mediasRes = createResource((page: number, pageSize: number) => {
      if (typeof props.dataSource === 'function') {
        return props.dataSource(page, pageSize);
      }
      return Promise.resolve(props.dataSource);
    });

    $mediasRes.read(props.page!, props.pageSize!);

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

    const refresh = (force = false) => {
      force && (localPagination.value = Object.assign({}, localPagination.value, { current: 1 }));
      $mediasRes.read(localPagination.value.current!, localPagination.value.pageSize!);
    };

    expose({
      refresh,
    });

    return () => {
      const { $loading: loading, $result: medias } = $mediasRes;
      return (
        <Spin spinning={loading} delay={260}>
          <div class={['mt-3', prefixCls]}>
            {medias &&
              medias.rows.map((media) => (
                <div class={`${prefixCls}-item`} onClick={() => emit('itemClick', media)}>
                  <Card hoverable size="small">
                    <img
                      slot="cover"
                      class={`${prefixCls}-item__cover`}
                      alt="example"
                      src={media.thumbnail?.fullPath ?? FileUnknownSvg}
                    />
                    <p class="mb-0 text-ellipsis">{media.originalFileName}</p>
                  </Card>
                </div>
              ))}
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
                $mediasRes.read(page, pageSize);
                emit('pageChange', page, pageSize);
              }}
              onShowSizeChange={(current, pageSize) => {
                localPagination.value.current = current;
                localPagination.value.pageSize = pageSize;
                $mediasRes.read(current, pageSize);
                emit('pageChange', current, pageSize);
              }}
            />
          </div>
        </Spin>
      );
    };
  },
});

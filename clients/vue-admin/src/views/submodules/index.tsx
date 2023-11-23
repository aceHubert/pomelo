import { defineComponent, ref, reactive, watch } from '@vue/composition-api';
import { Button, Icon, Input, List } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { useLocationMixin } from '@ace-pomelo/shared-client';
import { useSubmoduleApi } from '@/fetch/apis';
import classes from './index.module.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { PagedSubModuleArgs, PagedSubModuleItem } from '@/fetch/apis';

export default defineComponent({
  name: 'SubModules',
  head() {
    return {
      title: this.$tv('page_submodules.page_title', '模块') as string,
    };
  },
  props: {
    name: { type: String as PropType<string> },
  },
  setup(props) {
    const router = useRouter();
    const locationMixin = useLocationMixin();
    const submoduleApi = useSubmoduleApi();

    const loadingRef = ref(false);
    const loadingMoreRef = ref(false);
    const subModules = reactive({
      rows: [] as PagedSubModuleItem[],
      total: 0,
    });

    const getModules = async (query: PagedSubModuleArgs, callback: (rows: PagedSubModuleItem[]) => void) => {
      const {
        subModules: { rows, total },
      } = await submoduleApi.getPaged({
        variables: {
          offset: subModules.rows.length,
          limit: 10,
          ...query,
        },
        catchError: true,
        loading: () => {
          if (subModules.rows.length) {
            loadingMoreRef.value = true;
          } else {
            loadingRef.value = true;
          }
          return () => {
            if (subModules.rows.length) {
              loadingMoreRef.value = false;
            } else {
              loadingRef.value = false;
            }
          };
        },
      });
      subModules.total = total;
      callback(rows);
    };

    watch(
      () => props.name,
      (val) => {
        getModules(
          {
            name: val,
          },
          (rows) => {
            subModules.rows = rows;
          },
        );
      },
      { immediate: true },
    );

    const onLoadMore = () => {
      getModules(
        {
          name: props.name,
        },
        (rows) => {
          subModules.rows = subModules.rows.concat(rows);
        },
      );
    };

    // const onPageChanged = (page: number, pageSize: number) => {
    //   subModules.search.limit = pageSize;
    //   subModules.search.offset = (page - 1) * pageSize;

    //   getModules();
    // };

    return () => (
      <div class={[classes.container]}>
        <div class={classes.actionBox}>
          <Input.Search
            placeholder={props.name || 'Enter package name'}
            props={{
              size: 'large',
              'enter-button': 'Search',
            }}
            onSearch={(search: string) => locationMixin.updateRouteQuery({ search }, { replace: true })}
          />
        </div>
        <div class={classes.listBox}>
          <List
            loading={loadingRef.value}
            dataSource={subModules.rows}
            itemLayout="horizontal"
            scopedSlots={{
              renderItem: (item: PagedSubModuleItem) => (
                <List.Item
                  scopedSlots={{
                    actions: () => [
                      <Icon key="setting" type="setting" />,
                      <Icon key="edit" type="edit" />,
                      <Icon
                        key="ellipsis"
                        type="ellipsis"
                        title="View"
                        onClick={() =>
                          router.push({ name: 'sub-modules-details', params: { name: encodeURIComponent(item.name) } })
                        }
                      />,
                    ],
                  }}
                >
                  <List.Item.Meta title={item.name} description={item.description}></List.Item.Meta>
                </List.Item>
              ),
              loadMore: () =>
                subModules.rows.length < subModules.total ? (
                  <div class="text-center py-3">
                    <Button type="link" loading={loadingMoreRef.value} onClick={onLoadMore.bind(null)}>
                      {loadingMoreRef.value ? '加载中' : '加载更多'}
                    </Button>
                  </div>
                ) : (
                  <div></div>
                ),
            }}
          ></List>
        </div>
      </div>
    );
  },
});

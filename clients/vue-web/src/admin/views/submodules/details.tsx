import { defineComponent, ref } from '@vue/composition-api';
import { Skeleton, Tabs, Icon } from 'ant-design-vue';
import { MarkdownInput } from 'antdv-layout-pro';
import { useSubmoduleApi } from '@/admin/fetch';
import classes from './details.module.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { SubModuleItem } from '@/admin/fetch';

export default defineComponent({
  name: 'SubModuleDetails',
  head() {
    return {
      title: this.$tv('page_submodules.details.page_title', '模块详情') as string,
    };
  },
  props: {
    name: { type: String as PropType<string>, required: true },
    version: { type: String as PropType<string> },
  },
  setup(props) {
    const submoduleApi = useSubmoduleApi();

    const subModule = ref<SubModuleItem | null>(null);
    const latestVersion = ref('');
    const loading = ref(false);

    submoduleApi
      .get({
        variables: {
          name: props.name,
        },
        catchError: true,
        loading: () => {
          loading.value = true;
          return () => (loading.value = false);
        },
      })
      .then(({ subModule: data }) => {
        subModule.value = data;
        latestVersion.value = data?.tags.find(({ name }) => name === 'latest')?.version || '';
      });

    return () => (
      <div class={[classes.container]}>
        {loading.value ? (
          <Skeleton active />
        ) : (
          subModule.value && (
            <div>
              <h2>{subModule.value.name}</h2>
              <p class="text--secondary mb-1">
                <span>{latestVersion.value}</span>
              </p>
              <Tabs>
                <Tabs.TabPane>
                  <span slot="tab">
                    <Icon type="file-markdown" />
                    Readme
                  </span>
                  <MarkdownInput value={subModule.value.readme || ''} />
                </Tabs.TabPane>
              </Tabs>
            </div>
          )
        )}
      </div>
    );
  },
});

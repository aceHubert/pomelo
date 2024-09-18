import { defineComponent, h } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { SkeletonLoader, Result } from '@/components';
import { useDeviceMixin } from '@/mixins';
import { useI18n } from '@/hooks';
import { usePostApi } from '@/fetch/apis';

const MobileComponent = () => import(/* webpackChunkName: "mobile" */ './mobile');
const DesktopComponent = () => import(/* webpackChunkName: "desktop" */ './desktop');

export const HomeDefault = defineComponent({
  name: 'PageView',
  setup() {
    const i18n = useI18n();
    const router = useRouter();
    const deviceMixin = useDeviceMixin();
    const postApi = usePostApi();

    const $postRes = createResource((args: { offset?: number; limit?: number } = {}) => {
      return postApi
        .getPublished({
          variables: {
            ...args,
            metaKeys: ['feature-image'],
          },
        })
        .then(({ posts }) => posts);
    });

    $postRes.read();

    return () => {
      const { $result: posts, $loading, $error } = $postRes;

      return $loading ? (
        <div class="px-4">
          <div class="d-flex flex-wrap justify-content-start mx-n3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div style="flex: 0 0 25%; padding: 10px 12px">
                <SkeletonLoader key={index} type="circle" style="margin: auto; width: 100%; padding-top: 100%;" />
              </div>
            ))}
          </div>
          <div class="mt-2">
            <SkeletonLoader style=" height: 32px; width: 100px;" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} class="d-flex mt-4">
                <div class="flex-auto pr-4">
                  <SkeletonLoader style="height: 14px; width: 50%; margin-top: 5px;" />
                  <SkeletonLoader style="height: 14px; margin-top: 5px;" />
                  <SkeletonLoader style="height: 14px; margin-top: 5px;" />
                </div>
                <SkeletonLoader class="flex-none" style="height: 60px; width: 100px;" />
              </div>
            ))}
          </div>
        </div>
      ) : $error ? (
        <Result
          status="error"
          title={i18n.tv('home_component.load_error_text', '加载错误！') as string}
          subTitle={$error.message}
        ></Result>
      ) : (
        h(deviceMixin.isDesktop ? DesktopComponent : MobileComponent, {
          props: {
            posts,
            pageSize: 20,
          },
          on: {
            itemClick: (item) => router.push({ name: 'post', params: { id: item.id } }),
            pageChange: (page) => $postRes.read(page),
          },
        })
      );
    };
  },
});

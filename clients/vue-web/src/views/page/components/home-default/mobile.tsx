import moment from 'moment';
import { defineComponent } from '@vue/composition-api';
import { List } from 'vant';
import { useI18n } from '@/hooks';
import classes from './mobile.module.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { Paged, PagedPostTemplateItem } from '@/fetch/apis';

export default defineComponent({
  name: 'DesktopHome',
  props: {
    posts: {
      type: Object as PropType<Paged<PagedPostTemplateItem>>,
      required: true,
    },
    pageSize: {
      type: Number,
      default: 20,
    },
  },
  emits: ['itemClick', 'pageChange'],
  setup(props, { emit }) {
    const i18n = useI18n();

    return () => (
      <div class={classes.container}>
        <List>
          {props.posts.rows.map((item) => (
            <div class={['d-flex bdr-b', classes.item]} onClick={() => emit('itemClick', item)}>
              <div class="flex-auto pr-2">
                <p class={[classes.itemTitle]}>{item.title}</p>
                <p class={[classes.itemDescription]}>{item.excerpt}</p>
                <ul class={[classes.itemActions]}>
                  <li>
                    <span>{moment(item.createdAt).locale(i18n.locale).format('L')}</span>
                  </li>
                  <li>
                    {item.tags.map((tag) => (
                      <router-link
                        to={{ name: 'tag', params: { id: tag.id }, query: { filter: 'post' } }}
                        class="text--secondary mr-1"
                      >
                        {tag.name}
                      </router-link>
                    ))}
                  </li>
                </ul>
              </div>
              <div class="flex-none">
                <div
                  class={classes.featureImage}
                  style={{
                    'background-image': `url(${
                      item.metas.find((meta) => meta.key === 'feature-image')?.value ||
                      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                    })`,
                  }}
                  alt="feature-image"
                />
              </div>
            </div>
          ))}
        </List>
      </div>
    );
  },
});

import moment from 'moment';
import { defineComponent } from '@vue/composition-api';
import { List, Icon } from 'ant-design-vue';
import { useI18n } from '@/hooks';
import classes from './desktop.module.less';

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
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            pageSize: props.pageSize,
            total: props.posts.total,
            onChange: (page, pageSize) => emit('pageChange', { offset: (page - 1) * pageSize, limit: pageSize }),
          }}
          dataSource={props.posts.rows}
          scopedSlots={{
            renderItem: (item: PagedPostTemplateItem) => (
              <List.Item
                key={item.id}
                scopedSlots={{
                  extra: () => (
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
                  ),
                  actions: () => [
                    <span>{moment(item.createdAt).locale(i18n.locale).format('L')}</span>,
                    <div>
                      <Icon type="tag" class="mr-2" />
                      {item.tags.map((tag) => (
                        <router-link
                          to={{ name: 'tag', params: { id: tag.id }, query: { filter: 'post' } }}
                          class="text--secondary mr-1"
                        >
                          {tag.name}
                        </router-link>
                      ))}
                    </div>,
                  ],
                }}
                onClick={() => emit('itemClick', item)}
              >
                <List.Item.Meta title={item.title} description={item.excerpt} />
              </List.Item>
            ),
          }}
        ></List>
      </div>
    );
  },
});

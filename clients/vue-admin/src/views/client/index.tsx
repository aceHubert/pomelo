import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { upperFirst } from 'lodash-es';
import { defineComponent, ref, reactive, computed, set, nextTick } from '@vue/composition-api';
import { Button, Card, Form, Input, Space, Descriptions, Icon, Tag, Radio } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { useDeviceType } from '@ace-pomelo/shared-client';
import { Modal, message } from '@/components';
import { useI18n } from '@/hooks';
import { useClientApi } from '@/fetch/apis';
import classes from './index.module.less';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column, DataSourceFn } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedClientArgs, PagedClientModel } from '@/fetch/apis';

type ClientsProps = {
  form: WrappedFormUtils;
};

export default Form.create({})(
  defineComponent({
    name: 'Clients',
    head() {
      return {
        title: this.$tv('page_clients.page_title', '客户端管理') as string,
      };
    },
    setup(props: ClientsProps, { refs }) {
      const i18n = useI18n();
      const deviceType = useDeviceType();

      const clientApi = useClientApi();
      const searchQuery = reactive<PagedClientArgs>({});
      const isAddModalVisable = ref(false);

      const rowCount = ref(0);
      const columns = computed(() => {
        const renderRowInline = (record: PagedClientModel['rows'][0]) => {
          return (
            <Descriptions size="small" column={1} class="mt-2">
              <Descriptions.Item>
                <span slot="label" class="text--secondary">
                  {i18n.tv('page_clients.table_header.application_type_label', '应用类型')}
                </span>
                <Tag color={record.applicationType === 'native' ? 'cyan' : 'green'}>
                  {upperFirst(record.applicationType ?? 'web')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item>
                <span slot="label" class="text--secondary">
                  {i18n.tv('page_clients.table_header.status_label', '状态')}
                </span>
                <Tag color={record.enabled ? 'green' : 'red'}>
                  {i18n.tv(
                    `page_clients.status.${record.enabled ? 'enabled' : 'disabled'}`,
                    record.enabled ? '启用' : '禁用',
                  )}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item>
                <span slot="label" class="text--secondary">
                  {record.enabled
                    ? i18n.tv('page_clients.updated_at', '最后修改于')
                    : i18n.tv('page_clients.disabled_at', '禁用于')}
                </span>
                {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          );
        };

        const renderActions = (record: PagedClientModel['rows'][0]) => [
          <router-link
            to={{
              name: 'client-detail',
              params: {
                clientId: `${record.clientId}`,
              },
            }}
          >
            {i18n.tv('page_clients.action_btn_text.detail', '详情')}
          </router-link>,
          <router-link
            to={{
              name: 'client-grant-types',
              params: {
                clientId: `${record.clientId}`,
              },
            }}
            class="primary-7--text hover:primary-6--text active:primary-8--text"
          >
            {i18n.tv('page_clients.action_btn_text.grant_type', '授权类型')}
          </router-link>,
          <router-link
            to={{
              name: 'client-scopes',
              params: {
                clientId: `${record.clientId}`,
              },
            }}
            class="primary-8--text hover:primary-7--text active:primary-9--text"
          >
            {i18n.tv('page_clients.action_btn_text.scopes', '授权范围')}
          </router-link>,
          <router-link
            to={{
              name: 'client-claims',
              params: {
                clientId: `${record.clientId}`,
              },
            }}
            class="primary-9--text hover:primary-7--text active:primary-10--text"
          >
            {i18n.tv('page_clients.action_btn_text.claims', '声明')}
          </router-link>,
        ];

        return [
          {
            key: 'clientName',
            title: i18n.tv('page_clients.table_header.name_label', '客户端名称'),
            width: 320,
            customRender: (_: any, record: PagedClientModel['rows'][0]) => {
              return (
                <div class={classes.clientName}>
                  <p class="mb-0">{record.clientName}</p>
                  <Space class={['mt-1', classes.actions]}>{renderActions(record)}</Space>
                  {!deviceType.isDesktop && renderRowInline(record)}
                </div>
              );
            },
          },
          deviceType.isDesktop && {
            key: 'applicationType',
            title: i18n.tv('page_clients.table_header.application_type_label', '应用类型'),
            align: 'center',
            width: 100,
            customRender: (_: any, record: PagedClientModel['rows'][0]) => (
              <Tag color={record.applicationType === 'native' ? 'cyan' : 'green'}>
                {upperFirst(record.applicationType ?? 'web')}
              </Tag>
            ),
          },
          deviceType.isDesktop && {
            dataIndex: 'updatedAt',
            align: 'left',
            customRender: (_: any, record: PagedClientModel['rows'][0]) => (
              <div>
                <p class="mb-1">
                  {record.enabled ? (
                    i18n.tv('page_clients.updated_at', '最后修改于')
                  ) : (
                    <span class="error--text">
                      <Icon type="minus-circle" class="mr-1" />
                      {i18n.tv('page_clients.disabled_at', '禁用于')}
                    </span>
                  )}
                </p>
                {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
              </div>
            ),
          },
        ].filter(Boolean) as Column[];
      });

      const loadData: DataSourceFn = ({ page, size }) => {
        return clientApi
          .getPaged({
            variables: {
              ...searchQuery,
              offset: (page - 1) * size,
              limit: size,
            },
          })
          .then(({ clients }) => {
            rowCount.value = clients.total;
            return clients;
          });
      };

      // 新增客户端
      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .create({
              variables: {
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(() => {
              isAddModalVisable.value = false;
              props.form.resetFields();
              refreshTable(false);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      // 刷新table
      function refreshTable(force = true) {
        (refs['table'] as any)?.refresh(force);
      }

      return () => {
        return (
          <Card bordered={false} size="small">
            <SearchForm
              keywordPlaceholder={i18n.tv('page_clients.search_placeholder', '“客户端名称”模糊搜索') as string}
              keywordName="clientName"
              rowCount={rowCount.value}
              scopedSlots={{
                filter: () => (
                  <Button
                    type="primary"
                    icon="plus"
                    onClick={() => {
                      isAddModalVisable.value = true;
                      nextTick(() => {
                        props.form.setFieldsValue({ clientId: uuidv4() });
                      });
                    }}
                  >
                    {i18n.tv('page_clients.action_btn_text.add', '新增客户端')}
                  </Button>
                ),
              }}
              onSearch={(values) => {
                Object.keys(values).forEach((key) => {
                  set(searchQuery, key, values[key]);
                });
                refreshTable();
              }}
            />
            <AsyncTable
              ref="table"
              attrs={{
                rowKey: 'id',
                size: 'small',
                bordered: true,
                scroll: { x: true, y: 0 },
                rowClassName: (record: PagedClientModel['rows'][0]) =>
                  `${classes.row} ${classes.rowAlign}` + (record.enabled ? '' : ` ${classes.rowDisabled}`),
              }}
              pageURI
              columns={columns.value}
              dataSource={loadData}
            />

            <Modal
              vModel={isAddModalVisable.value}
              title={i18n.tv('page_clients.add_modal_title', '添加客户端')}
              closable={false}
              maskClosable={false}
              scopedSlots={{
                footer: () => (
                  <div>
                    <Button disabled={adding.value} onClick={() => (isAddModalVisable.value = false)}>
                      {i18n.tv('common.btn_text.cancel', '取消')}
                    </Button>
                    <Button type="primary" class="ml-2" loading={adding.value} onClick={() => handleAdd()}>
                      {i18n.tv('common.btn_text.save', '保存')}
                    </Button>
                  </div>
                ),
              }}
            >
              <Form form={props.form} labelCol={{ span: 5 }} wrapperCol={{ span: 15 }}>
                <Form.Item label={i18n.tv('page_clients.form.client_id_label', '客户端ID')}>
                  <Input.Group compact>
                    <Input
                      v-decorator={[
                        'clientId',
                        {
                          rules: [
                            {
                              required: true,
                              message: i18n.tv('page_clients.form.client_id_required', '请输入客户端ID'),
                            },
                          ],
                        },
                      ]}
                      placeholder={i18n.tv('page_clients.form.client_id_placeholder', '请输入客户端ID')}
                      style="width: 230px"
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        props.form.setFieldsValue({ clientId: uuidv4() });
                      }}
                    >
                      {i18n.tv('page_clients.form.generate_btn', '生成')}
                    </Button>
                  </Input.Group>
                </Form.Item>
                <Form.Item label={i18n.tv('page_clients.form.name_label', '客户端名称')}>
                  <Input
                    v-decorator={[
                      'clientName',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_clients.form.client_name_required', '请输入客户端名称'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_clients.form.name_placeholder', '请输入客户端名称')}
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_clients.form.application_type_label', '客户端类型')}>
                  <Radio.Group
                    v-decorator={[
                      'applicationType',
                      {
                        initialValue: 'web',
                      },
                    ]}
                  >
                    <Radio.Button value="web">Web</Radio.Button>
                    <Radio.Button value="native">Native</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Form>
            </Modal>
          </Card>
        );
      };
    },
  }),
);

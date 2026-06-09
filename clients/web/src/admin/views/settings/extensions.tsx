import { computed, defineComponent, onMounted, ref } from '@vue/composition-api';
import { Alert, Button, Card, List, message, Modal, Spin, Tag } from 'ant-design-vue';
import { useBasicApi } from '@/fetch/apis/basic';
import { useDeviceMixin } from '@/mixins';
import { waitForSystemRestart } from './composables/use-system-restart-polling';

// Types
import type { RuntimeExtensionState, RuntimeExtensionStateItem, SystemHeartbeat } from '@/fetch/apis/basic';

export default defineComponent({
  setup() {
    const basicApi = useBasicApi();
    const deviceMixin = useDeviceMixin();
    const loading = ref(false);
    const restarting = ref(false);
    const state = ref<RuntimeExtensionState>();

    const activePluginIds = computed(() => state.value?.activePlugins || []);
    const failedPlugins = computed(() => state.value?.failedPlugins || []);

    const loadState = async () => {
      loading.value = true;
      try {
        const result = await basicApi.getRuntimeExtensions();
        state.value = result.runtimeExtensions;
      } catch (error: any) {
        message.error(error.message || '扩展状态读取失败');
      } finally {
        loading.value = false;
      }
    };

    const getHeartbeat = async (): Promise<SystemHeartbeat> => {
      const result = await basicApi.getSystemHeartbeat();
      return result.heartbeat;
    };

    const runRestartFlow = async (beforeBootId: string) => {
      restarting.value = true;
      try {
        await basicApi.restartSystem();
        const heartbeat = await waitForSystemRestart({
          beforeBootId,
          getHeartbeat,
        });

        if (heartbeat.failedPlugins.length) {
          message.warning('服务已重启，但存在插件加载失败，请查看状态详情');
        } else {
          message.success('服务已重启');
        }

        window.location.reload();
      } catch (error: any) {
        message.error(error.message || '服务重启确认失败');
        restarting.value = false;
      }
    };

    const updateActivePlugins = async (nextActivePlugins: string[]) => {
      if (!state.value || restarting.value) return;

      loading.value = true;
      try {
        const beforeBootId = state.value.bootId;
        const result = await basicApi.updateRuntimePlugins({
          variables: {
            model: {
              activePlugins: nextActivePlugins,
            },
          },
        });
        state.value = result.updateRuntimePlugins.state;

        if (result.updateRuntimePlugins.restartRequired) {
          await runRestartFlow(beforeBootId);
        } else {
          message.success('插件配置已更新');
        }
      } catch (error: any) {
        message.error(error.message || '插件配置更新失败');
      } finally {
        loading.value = false;
      }
    };

    const togglePlugin = (plugin: RuntimeExtensionStateItem) => {
      const nextActivePluginSet = new Set(activePluginIds.value);
      if (plugin.configured) {
        nextActivePluginSet.delete(plugin.id);
      } else {
        nextActivePluginSet.add(plugin.id);
      }

      Modal.confirm({
        title: plugin.configured ? '停用插件' : '启用插件',
        content: '插件配置保存后将请求 BFF 重启，重启成功后会刷新当前页面。',
        okText: '确认',
        cancelText: '取消',
        onOk: () => updateActivePlugins(Array.from(nextActivePluginSet)),
      });
    };

    const uninstallPlugin = (plugin: RuntimeExtensionStateItem) => {
      if (!state.value || restarting.value) return;

      Modal.confirm({
        title: '标记卸载插件',
        content: '插件会写入卸载配置并在重启后生效，目录文件不会被自动删除。',
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          const beforeBootId = state.value!.bootId;
          const nextActivePlugins = activePluginIds.value.filter((pluginId) => pluginId !== plugin.id);
          const nextUninstallPlugins = Array.from(new Set([...(state.value!.uninstallPlugins || []), plugin.id]));

          loading.value = true;
          try {
            const result = await basicApi.updateRuntimePlugins({
              variables: {
                model: {
                  activePlugins: nextActivePlugins,
                  uninstallPlugins: nextUninstallPlugins,
                },
              },
            });
            state.value = result.updateRuntimePlugins.state;
            await runRestartFlow(beforeBootId);
          } catch (error: any) {
            message.error(error.message || '插件卸载配置更新失败');
          } finally {
            loading.value = false;
          }
        },
      });
    };

    const renderPluginStatus = (plugin: RuntimeExtensionStateItem) => {
      if (plugin.loaded) return <Tag color="green">已加载</Tag>;
      if (plugin.failedReason) return <Tag color="red">失败</Tag>;
      if (plugin.configured) return <Tag color="orange">待重启</Tag>;
      return <Tag>未启用</Tag>;
    };

    onMounted(loadState);

    return () => (
      <Spin spinning={loading.value || restarting.value} tip={restarting.value ? '正在等待服务重启' : '加载中'}>
        <Card bordered={false} size={deviceMixin.isMobile ? 'small' : 'default'}>
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2>扩展管理</h2>
              <p class="text--secondary mb-0">插件启用状态由 options 表保存，后端插件在 BFF 重启后进入 Nest IoC。</p>
            </div>
            <Button icon="reload" onClick={loadState} disabled={loading.value || restarting.value}>
              刷新
            </Button>
          </div>

          {state.value?.optionsReadError ? (
            <Alert
              class="mb-4"
              type="warning"
              showIcon
              message="配置读取失败"
              description={state.value.optionsReadError}
            />
          ) : null}

          {failedPlugins.value.length ? (
            <Alert
              class="mb-4"
              type="error"
              showIcon
              message="插件加载失败"
              description={failedPlugins.value.map((plugin) => `${plugin.id}: ${plugin.reason}`).join('；')}
            />
          ) : null}

          <List
            bordered
            dataSource={state.value?.plugins || []}
            locale={{ emptyText: '暂无插件' }}
            scopedSlots={{
              renderItem: (plugin: RuntimeExtensionStateItem) => (
                <List.Item
                  scopedSlots={{
                    actions: () => [
                      <Button
                        key="toggle"
                        type={plugin.configured ? 'default' : 'primary'}
                        disabled={!plugin.installed || restarting.value}
                        onClick={() => togglePlugin(plugin)}
                      >
                        {plugin.configured ? '停用' : '启用'}
                      </Button>,
                      <Button
                        key="uninstall"
                        disabled={!plugin.installed || restarting.value}
                        onClick={() => uninstallPlugin(plugin)}
                      >
                        卸载
                      </Button>,
                    ],
                  }}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {plugin.name} <span class="text--secondary">({plugin.id})</span>
                      </span>
                    }
                    description={
                      <div>
                        <div>{plugin.description || '暂无描述'}</div>
                        {plugin.failedReason ? <div class="danger--text mt-1">{plugin.failedReason}</div> : null}
                      </div>
                    }
                  />
                  <div>{renderPluginStatus(plugin)}</div>
                </List.Item>
              ),
            }}
          />
        </Card>
      </Spin>
    );
  },
});

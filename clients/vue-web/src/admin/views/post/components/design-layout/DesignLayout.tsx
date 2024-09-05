import { defineComponent, ref, watch, type PropType } from '@vue/composition-api';
import {
  Layout,
  Drawer,
  Tooltip,
  Popover,
  Card,
  Spin,
  Icon,
  Button,
  Dropdown,
  Menu,
  Row,
  Col,
  Space,
} from 'ant-design-vue';
import { TemplateStatus } from '@ace-pomelo/shared/client';
import { useI18n } from '@/hooks';
import { useAppMixin, useDeviceMixin } from '@/mixins';
import IconMore from '@admin/assets/icons/more.svg?inline';
import './index.less';

export type ActionStatus = {
  // 内容是否有修改
  changed: boolean;
  // 正在请求数据
  processing: boolean;
  // 修改数据
  updating: boolean;
  // 修改并发布
  publishing: boolean;
  // 修改并保存到草稿
  savingToDarft: boolean;
  // 修改并将状态修改为 Pending
  submitingReview: boolean;
  // 通过审核
  approvingReview: boolean;
  // 不通过审核
  rejectingReview: boolean;
  // 禁用所有操作
  disabledActions: boolean;
};

export type ActionCapability = {
  // 编辑权限
  canEdit: boolean;
  // 编辑已发布内容权限
  canEditPublished: boolean;
  // 删除权限
  canDelete: boolean;
  // 删除已发布内容权限
  canDeletePublished: boolean;
  // 发布权限
  canPublish: boolean;
};

export enum Action {
  // 修改
  Update = 'update',
  // 保存发布内容至草稿
  SwitchToDraft = 'switchToDraft',
  // 保存到草稿
  SaveToDraft = 'saveToDraft',
  // 申请审核
  SubmitReview = 'submitReview',
  // 审核通过
  ApproveReview = 'approveReview',
  // 审核不通过
  RejectReview = 'rejectReview',
  // 发布
  Publish = 'publish',
}

export type DesignLayoutProps = {
  /**
   * 状态 - 按纽显示
   */
  status?: TemplateStatus;
  /**
   * 操作状态 - 按纽状态显示
   */
  actionStatus: ActionStatus;
  /**
   * 操作能力 - 按纽显示
   */
  actionCapability: ActionCapability;
  /**
   * 是否是自己的 - (审核非自己的内容)
   */
  isSelfContent: boolean;
  /**
   * sider drawer 显示方式，默认："auto"
   * auto: 在 Mobile 模式下使用 Drawer 方式显示侧边栏
   * always: 一直使用 Drawer 方式显示侧边栏
   */
  siderDrawerMode?: 'auto' | 'always';
  /**
   * sider/drawer 折叠，默认：true
   */
  siderCollapsed?: boolean;
  /**
   * sider/drawer 标题，默认："设置"
   */
  siderTitle?: string;
};

export default defineComponent({
  name: 'DesignLayout',
  props: {
    status: { type: String as PropType<TemplateStatus>, default: TemplateStatus.Draft },
    actionStatus: { type: Object as PropType<ActionStatus>, default: () => ({}) },
    actionCapability: { type: Object as PropType<ActionCapability>, default: () => ({}) },
    isSelfContent: Boolean,
    siderDrawerMode: String,
    siderCollapsed: Boolean,
    siderTitle: String,
    siderTheme: String,
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    const appMixin = useAppMixin();
    const deviceMixin = useDeviceMixin();

    const prefixCls = 'design-layout';
    const headerHeightRef = ref(48);
    const siderWidthRef = ref(300);
    const siderCollapsedRef = ref(props.siderCollapsed ?? !deviceMixin.isDesktop);

    watch(
      () => props.siderCollapsed,
      (collapsed) => {
        if (siderCollapsedRef.value !== collapsed) {
          siderCollapsedRef.value = collapsed!;
        }
      },
    );

    watch(siderCollapsedRef, (collapsed) => {
      emit('update:siderCollapsed', collapsed);
    });

    const handleAction = (action: Action) => {
      emit(action);
    };

    const renderIcon = (icon: any) => {
      if (icon === undefined || icon === 'none' || icon === null) {
        return null;
      }

      return typeof icon === 'object' ? <Icon component={icon}></Icon> : <Icon type={icon}></Icon>;
    };

    const renderLogo = () => {
      const logo = appMixin.siteLogo;

      return typeof logo === 'string' ? <img class="logo-img" src={logo} alt="logo" /> : renderIcon(logo);
    };

    const renderHeader = () => {
      return (
        <Layout.Header
          class={`${prefixCls}-header`}
          style={{
            padding: 0,
            height: `${headerHeightRef.value}px`,
            lineHeight: `${headerHeightRef.value}px`,
            width: '100%',
          }}
        >
          <div class={`${prefixCls}-header-wrapper`}>
            <Row gutter={16} type="flex" justify="space-between">
              <Col flex={0}>
                <Space>
                  <a href="javascript:;" class="logo" onClick={() => emit('logoClick')}>
                    {renderLogo()}
                  </a>
                  {slots.leftActions?.()}
                </Space>
              </Col>
              <Col flex={1} class={['text-right']}>
                <Space>
                  {slots.rightActions?.()}
                  {props.status === TemplateStatus.Pending && props.isSelfContent ? (
                    //  待审核状态,自己的内容可以修改
                    deviceMixin.isMobile ? (
                      !props.actionStatus.changed ||
                      props.actionStatus.processing ||
                      props.actionStatus.disabledActions ? (
                        <Dropdown.Button type="primary" onClick={() => handleAction(Action.SwitchToDraft)}>
                          {(props.actionStatus.updating ||
                            props.actionStatus.submitingReview ||
                            props.actionStatus.savingToDarft) && <Spin />}
                          {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                          <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                            <Menu.Item key={Action.Update} disabled>
                              {i18n.tv('page_templates.btn_text.update', '修改')}
                            </Menu.Item>
                          </Menu>
                          <Icon slot="icon" type="down" />
                        </Dropdown.Button>
                      ) : (
                        <Dropdown.Button type="primary" onClick={() => handleAction(Action.Update)}>
                          {(props.actionStatus.updating ||
                            props.actionStatus.submitingReview ||
                            props.actionStatus.savingToDarft) && <Spin />}
                          {i18n.tv('page_templates.btn_text.update', '修改')}
                          <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                            <Menu.Item key={Action.SwitchToDraft}>
                              {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                            </Menu.Item>
                          </Menu>
                          <Icon slot="icon" type="down" />
                        </Dropdown.Button>
                      )
                    ) : (
                      [
                        <Button
                          ghost
                          type="primary"
                          disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                          loading={props.actionStatus.savingToDarft}
                          title={i18n.tv('page_templates.btn_tips.switch_to_draft', '修改并保存内容至草稿箱')}
                          onClick={() => handleAction(Action.SwitchToDraft)}
                        >
                          {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                        </Button>,
                        <Button
                          type="primary"
                          disabled={
                            !props.actionStatus.changed ||
                            props.actionStatus.processing ||
                            props.actionStatus.disabledActions
                          }
                          loading={props.actionStatus.updating}
                          title={i18n.tv('page_templates.btn_tips.update', '保存修改内容')}
                          onClick={() => handleAction(Action.Update)}
                        >
                          {i18n.tv('page_templates.btn_text.update', '修改')}
                        </Button>,
                      ]
                    )
                  ) : props.status === TemplateStatus.Pending && props.actionCapability.canPublish ? (
                    //  待审核状态,有发布权限可以审核
                    deviceMixin.isMobile ? (
                      <Dropdown.Button
                        type="primary"
                        disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                        onClick={() => handleAction(Action.ApproveReview)}
                      >
                        {(props.actionStatus.approvingReview || props.actionStatus.rejectingReview) && <Spin />}
                        {i18n.tv('page_templates.btn_text.review_confirm', '审核通过')}
                        <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                          <Menu.Item
                            key={Action.RejectReview}
                            disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                          >
                            <span class="danger--text">
                              {i18n.tv('page_templates.btn_text.review_reject', '审核不通过')}
                            </span>
                          </Menu.Item>
                        </Menu>
                        <Icon slot="icon" type="down" />
                      </Dropdown.Button>
                    ) : (
                      [
                        <Button
                          type="danger"
                          disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                          loading={props.actionStatus.rejectingReview}
                          title={i18n.tv('page_templates.btn_tips.review_reject', '内容审核不通过')}
                          onClick={() => handleAction(Action.RejectReview)}
                        >
                          {i18n.tv('page_templates.btn_text.review_reject', '审核不通过')}
                        </Button>,
                        <Button
                          type="primary"
                          disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                          loading={props.actionStatus.approvingReview}
                          title={i18n.tv('page_templates.btn_tips.review_confirm', '内容审核通过')}
                          onClick={() => handleAction(Action.ApproveReview)}
                        >
                          {i18n.tv('page_templates.btn_text.review_confirm', '审核通过')}
                        </Button>,
                      ]
                    )
                  ) : props.actionCapability.canEdit ? (
                    props.status === TemplateStatus.Publish || props.status === TemplateStatus.Future ? (
                      // 已发布的状态，有编辑已发布的权限
                      props.actionCapability.canEditPublished ? (
                        deviceMixin.isMobile ? (
                          !props.actionStatus.changed ||
                          props.actionStatus.processing ||
                          props.actionStatus.disabledActions ? (
                            <Dropdown.Button type="primary" onClick={() => handleAction(Action.SwitchToDraft)}>
                              {(props.actionStatus.updating ||
                                props.actionStatus.submitingReview ||
                                props.actionStatus.savingToDarft) && <Spin />}
                              {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                              <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                                <Menu.Item key={Action.Update} disabled>
                                  {i18n.tv('page_templates.btn_text.update', '修改')}
                                </Menu.Item>
                              </Menu>
                              <Icon slot="icon" type="down" />
                            </Dropdown.Button>
                          ) : (
                            <Dropdown.Button type="primary" onClick={() => handleAction(Action.Update)}>
                              {(props.actionStatus.updating ||
                                props.actionStatus.submitingReview ||
                                props.actionStatus.savingToDarft) && <Spin />}
                              {i18n.tv('page_templates.btn_text.update', '修改')}
                              <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                                <Menu.Item key={Action.SwitchToDraft}>
                                  {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                                </Menu.Item>
                              </Menu>
                              <Icon slot="icon" type="down" />
                            </Dropdown.Button>
                          )
                        ) : (
                          [
                            <Button
                              ghost
                              type="primary"
                              disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                              loading={props.actionStatus.savingToDarft}
                              title={i18n.tv('page_templates.btn_tips.switch_to_draft', '修改并保存内容至草稿箱')}
                              onClick={() => handleAction(Action.SwitchToDraft)}
                            >
                              {i18n.tv('page_templates.btn_text.switch_to_draft', '保存修改至草稿')}
                            </Button>,
                            <Button
                              type="primary"
                              disabled={
                                !props.actionStatus.changed ||
                                props.actionStatus.processing ||
                                props.actionStatus.disabledActions
                              }
                              loading={props.actionStatus.updating}
                              title={i18n.tv('page_templates.btn_tips.update', '保存修改内容')}
                              onClick={() => handleAction(Action.Update)}
                            >
                              {i18n.tv('page_templates.btn_text.update', '修改')}
                            </Button>,
                          ]
                        )
                      ) : null
                    ) : deviceMixin.isMobile ? (
                      <Dropdown.Button
                        type="primary"
                        disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                        onClick={() =>
                          handleAction(props.actionCapability.canPublish ? Action.Publish : Action.SubmitReview)
                        }
                      >
                        {(props.actionStatus.publishing ||
                          props.actionStatus.savingToDarft ||
                          props.actionStatus.submitingReview) && <Spin />}
                        {props.actionCapability.canPublish
                          ? i18n.tv('page_templates.btn_text.publish', '发布')
                          : i18n.tv('page_templates.btn_text.submit_to_review', '提交审核')}
                        <Menu slot="overlay" onClick={({ key }: { key: Action }) => handleAction(key)}>
                          <Menu.Item
                            key={Action.SaveToDraft}
                            disabled={
                              !props.actionStatus.changed ||
                              props.actionStatus.processing ||
                              props.actionStatus.disabledActions
                            }
                          >
                            {i18n.tv('page_templates.btn_text.save_to_draft', '保存至草稿')}
                          </Menu.Item>
                        </Menu>
                        <Icon slot="icon" type="down" />
                      </Dropdown.Button>
                    ) : (
                      [
                        <Button
                          ghost
                          type="primary"
                          disabled={
                            !props.actionStatus.changed ||
                            props.actionStatus.processing ||
                            props.actionStatus.disabledActions
                          }
                          loading={props.actionStatus.savingToDarft}
                          title={i18n.tv('page_templates.btn_tips.save_to_draft', '保存内容至草稿箱')}
                          onClick={() => handleAction(Action.SaveToDraft)}
                        >
                          {i18n.tv('page_templates.btn_text.save_to_draft', '保存至草稿')}
                        </Button>,
                        props.actionCapability.canPublish ? (
                          <Button
                            type="primary"
                            disabled={props.actionStatus.processing || props.actionStatus.disabledActions}
                            loading={props.actionStatus.publishing}
                            title={i18n.tv('page_templates.btn_tips.publish', '发布内容')}
                            onClick={() => handleAction(Action.Publish)}
                          >
                            {i18n.tv('page_templates.btn_text.publish', '发布')}
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            disabled={
                              !props.actionStatus.changed ||
                              props.actionStatus.processing ||
                              props.actionStatus.disabledActions
                            }
                            loading={props.actionStatus.submitingReview}
                            title={i18n.tv('page_templates.btn_tips.submit_to_review', '提交内容审核')}
                            onClick={() => handleAction(Action.SubmitReview)}
                          >
                            {i18n.tv('page_templates.btn_text.submit_to_review', '提交审核')}
                          </Button>
                        ),
                      ]
                    )
                  ) : null}
                  {slots.settingsContent && (
                    <Tooltip
                      placement="bottom"
                      title={
                        !siderCollapsedRef.value
                          ? i18n.tv('page_templates.design_sider.close_settings_title', '关闭设置')
                          : props.siderTitle || i18n.tv('page_templates.design_settings.title', '设置')
                      }
                    >
                      <Button
                        type={siderCollapsedRef.value ? 'default' : 'primary'}
                        class="px-2"
                        onClick={() => (siderCollapsedRef.value = !siderCollapsedRef.value)}
                      >
                        <Icon type="setting"></Icon>
                      </Button>
                    </Tooltip>
                  )}
                  {slots.extraContent && (
                    <Popover placement="bottomRight">
                      <Icon component={IconMore} class="font-size-xl" style="vertical-align: middle; cursor:pointer" />
                      <template slot="content">{slots.extraContent()}</template>
                    </Popover>
                  )}
                </Space>
              </Col>
            </Row>
          </div>
        </Layout.Header>
      );
    };

    const renderSider = () => {
      const useDrawer = props.siderDrawerMode === 'always' || deviceMixin.isMobile;
      return [
        useDrawer ? (
          <Drawer
            class={`${prefixCls}-sider-drawer`}
            visible={!siderCollapsedRef.value}
            placement="right"
            width={siderWidthRef.value}
            maskClosable
            title={props.siderTitle || i18n.tv('page_templates.design_settings.title', '设置')}
            wrapStyle={{
              top: `${headerHeightRef.value - 1}px`,
              height: `calc(100vh - ${headerHeightRef.value}px)`,
            }}
            drawerStyle={{
              display: 'flex',
              flexDirection: 'column',
            }}
            headerStyle={{
              flex: 'none',
            }}
            bodyStyle={{
              padding: 0,
              flex: '1 1 auto',
              overflow: 'auto',
            }}
            onClose={() => (siderCollapsedRef.value = !siderCollapsedRef.value)}
          >
            <Card
              bordered={false}
              bodyStyle={{
                padding: '10px 0',
              }}
              style="border-radius:0; height:100%;"
            >
              {slots.settingsContent?.()}
            </Card>
          </Drawer>
        ) : null,
        <Layout.Sider
          v-show={!useDrawer}
          class={`${prefixCls}-sider`}
          width={siderWidthRef.value}
          collapsedWidth={0}
          collapsed={useDrawer ? false : siderCollapsedRef.value}
        >
          <Card
            title={props.siderTitle || i18n.tv('page_templates.design_settings.title', '设置')}
            bordered={false}
            headStyle={{ flex: 'none' }}
            bodyStyle={{ padding: '10px 0', flex: '1 1 auto', overflow: 'auto' }}
            style="border-radius:0; height:100%;"
            class="d-flex flex-column"
          >
            <template slot="extra">
              <Icon type="close" onClick={() => (siderCollapsedRef.value = !siderCollapsedRef.value)}></Icon>
            </template>

            {slots.settingsContent?.()}
          </Card>
        </Layout.Sider>,
      ];
    };

    const renderContent = () => {
      return <Layout.Content class={`${prefixCls}-content`}>{slots.default?.()}</Layout.Content>;
    };

    return () => (
      <Layout class={`${prefixCls}-wrapper`}>
        {renderHeader()}
        <Layout>
          {renderContent()}
          {slots.settingsContent && renderSider()}
        </Layout>
      </Layout>
    );
  },
});

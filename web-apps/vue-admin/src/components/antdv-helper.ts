import Vue from 'vue';
import { h } from '@vue/composition-api';
import { curry } from 'lodash-es';
import {
  Icon as AIcon,
  Spin as ASpin,
  message as Amessage,
  Modal as AModal,
  notification as Anotification,
} from 'ant-design-vue';
// @ts-ignore 没有类型定义
import { default as ABase } from 'ant-design-vue/es/base';
import { i18n } from '@/i18n';

// Types
import type { ModalOptions } from 'ant-design-vue/types/modal';
import type { Notification, NotificationOptions } from 'ant-design-vue/types/notification';
// import { DefineComponent } from '@/types';

// Types
import type { OmitVue } from '@/types';

Vue.use(ABase);

export const ANT_PREFIX_CLS = 'tpl-ops';

export const message = Amessage;
// message 修改自定义 less 前缀
message.config({
  top: '20vh',
  prefixCls: `${ANT_PREFIX_CLS}-message`,
  maxCount: 1,
});

export const notification = Anotification;
const _Anotification = { ...notification } as Notification;
// notification 修改自定义 less 前缀
const noticFn = curry(
  <FnName extends 'info' | 'error' | 'warning' | 'success'>(key: FnName, options: NotificationOptions) => {
    _Anotification[key]({
      prefixCls: `${ANT_PREFIX_CLS}-notification`,
      ...options,
    });
  },
);

notification.info = noticFn('info');
notification.success = noticFn('success');
notification.error = noticFn('error');
notification.warning = noticFn('warning');

export const Modal = AModal;
// 文本多语言需要重新计算
const modalTextProps = (): OmitVue<AModal> => ({
  cancelText: i18n.tv('common.btn_text.cancel', 'Cancel') as string,
  okText: i18n.tv('common.btn_text.confirm', 'Confirm') as string,
});

const _AModal = { ...Modal } as typeof AModal;
// Modal 修改自定义 less 前缀
const modalFn = curry(
  <FnName extends 'info' | 'error' | 'warning' | 'success' | 'confirm'>(key: FnName, options: ModalOptions) => {
    _AModal[key]({
      ...modalTextProps(),
      prefixCls: `${ANT_PREFIX_CLS}-modal`,
      cancelButtonProps: {
        props: {
          prefixCls: `${ANT_PREFIX_CLS}-btn`,
        },
      },
      okButtonProps: {
        props: {
          prefixCls: `${ANT_PREFIX_CLS}-btn`,
        },
      },
      ...options,
    });
  },
);
Modal.info = modalFn('info');
Modal.success = modalFn('success');
Modal.error = modalFn('error');
Modal.warning = modalFn('warning');
Modal.confirm = modalFn('confirm');

export const Spin = ASpin;

Spin.setDefaultIndicator({
  indicator: {
    render() {
      return h(AIcon, { style: 'font-size: 24px', props: { type: 'loading', spin: true } });
    },
  },
});

declare module 'ant-design-vue/types/message' {
  export interface MessageConfigOptions {
    prefixCls?: string;
  }
}

declare module 'ant-design-vue/types/notification' {
  export interface NotificationOptions {
    prefixCls?: string;
  }
}

declare module 'ant-design-vue/types/modal' {
  export interface ModalOptions {
    prefixCls?: string;
  }
}

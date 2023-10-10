import { defineComponent } from '@vue/composition-api';
import { Icon } from 'vant';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning';
export interface ResultProps {
  status: ResultStatus;
  title?: string;
  subTitle?: string;
}

export default defineComponent({
  name: 'Result',
  props: {
    status: {
      type: String,
      default: 'info',
      validator: (value: string) => ['success', 'error', 'info', 'warning'].includes(value),
    },
    title: {
      type: String,
    },
    subTitle: {
      type: String,
    },
  },
  setup(props: ResultProps, { slots }) {
    const iconMap = {
      success: { name: 'checked', color: '#1abd80' },
      error: { name: 'clear', color: '#f95155' },
      info: { name: 'info', color: '#046bde' },
      warning: { name: 'warning', color: '#fda900' },
    };

    return () => (
      <div class="result">
        <div class="result__icon">
          {slots.icon?.() || <Icon name={iconMap[props.status].name} color={iconMap[props.status].color} />}
        </div>
        {(slots.title || props.title) && <div class="result__title">{slots.title?.() ?? props.title}</div>}
        {(slots.subTitle || props.subTitle) && (
          <div class="result__sub-title">{slots.subTitle?.() ?? props.subTitle}</div>
        )}
        {slots.default && <div class="result__extra">{slots.default()}</div>}
      </div>
    );
  },
});

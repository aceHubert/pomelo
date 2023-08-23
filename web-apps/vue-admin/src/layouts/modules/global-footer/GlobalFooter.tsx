import { defineComponent } from '@vue/composition-api';
import { Icon } from 'ant-design-vue';
import './styles/global-footer.less';

export default defineComponent({
  name: 'GlobalFooter',
  setup(_, { slots }) {
    const prefixCls = 'global-footer';

    return () => (
      <div class={`${prefixCls}-wrapper`}>
        {slots.default?.()}
        <div class={`${prefixCls}__copyright`}>
          Copyright
          <Icon type="copyright" /> 2019-{new Date().getFullYear()} <span> Healthinkcare 版权所有 </span>
        </div>
      </div>
    );
  },
});

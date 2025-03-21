import { defineComponent, computed } from '@vue/composition-api';

const LOADER_TYPES = { rectangle: 'rectangle', circle: 'circle' };

const LOADER_CSS_CLASSES = {
  [LOADER_TYPES.rectangle]: 'rounded',
  [LOADER_TYPES.circle]: 'rounded-full',
};

type LoaderTypesKeys = keyof typeof LOADER_TYPES;
type LoaderTypesValues = (typeof LOADER_TYPES)[LoaderTypesKeys];

const SHIMMER_COLOR = '#e6e6e6';

const isHexColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');

  return typeof hexColor === 'string' && hexColor.startsWith('#') && hex.length === 6 && !isNaN(Number('0x' + hex));
};

const hexToRgb = (hex: string) => `${hex.match(/\w\w/g)?.map((x) => +`0x${x}`)}`;

export interface SkeletonLoaderProps {
  type: LoaderTypesValues;
  bgClass?: string;
  cssClass?: string;
  shimmerColor: string;
}

export default defineComponent({
  name: 'SkeletonLoader',
  props: {
    type: {
      type: String,
      default: LOADER_TYPES.rectangle,
      validator(value: LoaderTypesValues) {
        return Object.values(LOADER_TYPES).includes(value);
      },
    },
    bgClass: {
      type: String,
    },
    cssClass: {
      type: String,
    },
    shimmerColor: {
      type: String,
      default: SHIMMER_COLOR,
    },
  },
  setup(props: SkeletonLoaderProps, { slots }) {
    const shimmerStyle = computed(() => {
      const rgb = isHexColor(props.shimmerColor) ? hexToRgb(props.shimmerColor) : SHIMMER_COLOR;

      return {
        backgroundImage: `linear-gradient(90deg, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0.2) 20%, rgba(${rgb}, 0.5) 60%, rgba(${rgb}, 0))`,
      };
    });

    const loaderClass = computed(() => (props.cssClass ? props.cssClass : LOADER_CSS_CLASSES[props.type]));

    return () => (
      <div class={['skeleton-loader', props.bgClass, loaderClass.value]}>
        <div class="shimmer" style={shimmerStyle.value}></div>
        {slots.default?.()}
      </div>
    );
  },
});

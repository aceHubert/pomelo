import { defineComponent, ref, computed, reactive, watch } from 'vue-demi';
import { Drawer, List, Select, Switch, Tag, Icon, Tooltip, Divider } from 'ant-design-vue';
import { useConfigProvider } from '../../shared';
import { LayoutType, ContentWidth, Theme } from '../../types';
import { defaultPrimaryColor, getDefaultPresetColors } from './settingConfig';
import IconLight from './icons/light.svg';
import IconReallight from './icons/reallight.svg';
import IconDark from './icons/dark.svg';
import IconTopmenu from './icons/topmenu.svg';
import IconSiderMenu from './icons/sidermenu.svg';

// Types
import type { PropType } from 'vue-demi';

export interface SettingDrawerProps {
  visible: boolean;
  theme: Theme;
  primaryColor: string;
  presetColors?:
    | Array<{ key: string; color: string }>
    | ((defaultPresetColors: Array<{ key: string; color: string }>) => Array<{ key: string; color: string }>);
  layout: LayoutType;
  contentWidth: ContentWidth;
  fixedHeader: boolean;
  autoHideHeader: boolean;
  fixSiderbar: boolean;
  colorWeak: boolean;
  multiTab: boolean;
  darkModeSupport: boolean;
  invisibleHandle: boolean;
  prefixCls?: string;
  i18nKeyPrefix: string;
}

export default defineComponent({
  name: 'SettingDrawer',
  model: {
    prop: 'visible',
    event: 'change',
  },
  props: {
    visible: { type: Boolean, default: false },
    theme: { type: String, default: Theme.Light },
    primaryColor: { type: String, default: defaultPrimaryColor },
    presetColors: { type: [Array, Function] as PropType<SettingDrawerProps['presetColors']> },
    layout: { type: String, default: LayoutType.MixedMenu },
    contentWidth: { type: String, default: ContentWidth.Fluid },
    fixedHeader: { type: Boolean, default: true },
    autoHideHeader: { type: Boolean, default: false },
    fixSiderbar: { type: Boolean, default: true },
    colorWeak: { type: Boolean, default: false },
    multiTab: { type: Boolean, default: false },
    darkModeSupport: { type: Boolean, default: true },
    invisibleHandle: { type: Boolean, default: false },
    prefixCls: String,
    i18nKeyPrefix: {
      type: String,
      default: 'components.setting_drawer',
    },
  },
  setup(props: SettingDrawerProps, { emit, slots }) {
    const configProvider = useConfigProvider();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('setting-drawer', customizePrefixCls);

    const visibleRef = ref(props.visible);

    watch(visibleRef, (val) => {
      emit('change', val);
    });

    watch(
      () => props.visible,
      (val) => {
        if (val !== visibleRef.value) {
          visibleRef.value = val;
        }
      },
    );

    const configs = reactive({
      theme: props.theme,
      primaryColor: props.primaryColor,
      layout: props.layout,
      contentWidth: props.contentWidth,
      fixedHeader: props.fixedHeader,
      autoHideHeader: props.autoHideHeader,
      fixSiderbar: props.fixSiderbar,
      colorWeak: props.colorWeak,
      multiTab: props.multiTab,
    });

    watch(
      [
        () => props.theme,
        () => props.primaryColor,
        () => props.layout,
        () => props.contentWidth,
        () => props.fixedHeader,
        () => props.autoHideHeader,
        () => props.fixSiderbar,
        () => props.colorWeak,
        () => props.multiTab,
      ],
      ([theme, primaryColor, layout, contentWidth, fixedHeader, autoHideHeader, fixSiderbar, colorWeak, multiTab]) => {
        theme !== configs.theme && (configs.theme = theme);
        primaryColor !== configs.primaryColor && (configs.primaryColor = primaryColor);
        layout !== configs.layout && (configs.layout = layout);
        contentWidth !== configs.contentWidth && (configs.contentWidth = contentWidth);
        fixedHeader !== configs.fixedHeader && (configs.fixedHeader = fixedHeader);
        autoHideHeader !== configs.autoHideHeader && (configs.autoHideHeader = autoHideHeader);
        fixSiderbar !== configs.fixSiderbar && (configs.fixSiderbar = fixSiderbar);
        colorWeak !== configs.colorWeak && (configs.colorWeak = colorWeak);
        multiTab !== configs.multiTab && (configs.multiTab = multiTab);
      },
    );

    const presetColors = computed(() => {
      const defaultPresetColors = getDefaultPresetColors(
        configProvider.i18nRender,
        `${props.i18nKeyPrefix}.preset_colors`,
      );
      let colors;
      if (typeof props.presetColors === 'function') {
        colors = props.presetColors(defaultPresetColors);
      } else {
        colors = props.presetColors ?? defaultPresetColors;
      }

      if (!colors.some((item) => item.color === defaultPrimaryColor)) {
        colors.unshift({
          key: configProvider.i18nRender(`${props.i18nKeyPrefix}.preset_colors.daybreak_blue`, 'Daybreak Blue'),
          color: defaultPrimaryColor,
        });
      }
      return colors;
    });

    const handleThemeChange = (theme: Theme) => () => {
      configs.theme = theme;
      emit('update:theme', theme);
    };

    const handleColorChange = (color: string) => () => {
      configs.primaryColor = color;
      emit('update:primaryColor', color);
    };

    const handleContentWidthChange = (contentWidth: ContentWidth) => {
      configs.contentWidth = contentWidth;
      emit('update:contentWidth', contentWidth);
    };

    const handleAutoHideHeader = (autoHideHeader: boolean) => {
      configs.autoHideHeader = autoHideHeader;
      emit('update:autoHideHeader', autoHideHeader);
    };

    const handleFixedHeader = (fixedHeader: boolean) => {
      if (!fixedHeader) {
        handleAutoHideHeader(false);
      }
      configs.fixedHeader = fixedHeader;
      emit('update:fixedHeader', fixedHeader);
    };

    const handleFixSiderbar = (fixSiderbar: boolean) => {
      configs.fixSiderbar = fixSiderbar;
      emit('update:fixSiderbar', fixSiderbar);
    };

    const handleLayoutChange = (layout: LayoutType) => () => {
      if (layout === LayoutType.TopMenu) {
        handleFixedHeader(true);
        handleFixSiderbar(false);
      } else {
        handleContentWidthChange(ContentWidth.Fluid);
        handleFixedHeader(layout !== LayoutType.SiderMenu);
        handleFixSiderbar(true);
      }
      configs.layout = layout;
      emit('update:layout', layout);
    };

    const handleColorWeak = (colorWeak: boolean) => {
      configs.colorWeak = colorWeak;
      emit('update:colorWeak', colorWeak);
    };

    // const handleMultiTab = (multiTab: boolean) => {
    //   configs.multiTab = multiTab;
    //   emit('update:multiTab', multiTab);
    // };

    return () => (
      <Drawer
        visible={visibleRef.value}
        wrapClassName={prefixCls}
        width="300"
        placement="right"
        onClose={() => (visibleRef.value = false)}
      >
        <div class="mb-6">
          <h3 class={`${prefixCls}__title`}>
            {configProvider.i18nRender(`${props.i18nKeyPrefix}.page_style.title`, 'Page Style')}
          </h3>
          <div class={`${prefixCls}__block-checkbox`}>
            <Tooltip
              title={configProvider.i18nRender(`${props.i18nKeyPrefix}.page_style.reallight`, 'Reallight style')}
            >
              <div class={`${prefixCls}-block-checkbox__item`} onClick={handleThemeChange(Theme.RealLight)}>
                <img src={IconReallight} alt="real-light" />
                {configs.theme === Theme.RealLight && (
                  <div class="selected-icon">
                    <Icon type="check" />
                  </div>
                )}
              </div>
            </Tooltip>
            <Tooltip title={configProvider.i18nRender(`${props.i18nKeyPrefix}.page_style.light`, 'Light style')}>
              <div class={`${prefixCls}-block-checkbox__item`} onClick={handleThemeChange(Theme.Light)}>
                <img src={IconLight} alt="light" />
                {configs.theme === Theme.Light && (
                  <div class="selected-icon">
                    <Icon type="check" />
                  </div>
                )}
              </div>
            </Tooltip>
            {props.darkModeSupport && (
              <Tooltip title={configProvider.i18nRender(`${props.i18nKeyPrefix}.page_style.dark`, 'Dark style')}>
                <div class={`${prefixCls}-block-checkbox__item`} onClick={handleThemeChange(Theme.Dark)}>
                  <img src={IconDark} alt="dark" />
                  {configs.theme === Theme.Dark && (
                    <div class="selected-icon">
                      <Icon type="check" />
                    </div>
                  )}
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        <div class="mb-6">
          <h3 class={`${prefixCls}__title`}>
            {configProvider.i18nRender(`${props.i18nKeyPrefix}.primary_color.title`, 'Theme Color')}
          </h3>
          <div style="height: 20px">
            {presetColors.value.map((item) => (
              <Tooltip class={`${prefixCls}__block-color`} title={item.key} key={item.color}>
                <Tag color={item.color} onClick={handleColorChange(item.color)}>
                  {item.color === configs.primaryColor && <Icon type="check" />}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
        <Divider />

        <div class="mb-6">
          <h3 class={`${prefixCls}__title`}>
            {configProvider.i18nRender(`${props.i18nKeyPrefix}.navigation_mode.title`, 'Navigation Mode')}
          </h3>
          <div class={`${prefixCls}__block-checkbox`}>
            <Tooltip
              title={configProvider.i18nRender(`${props.i18nKeyPrefix}.navigation_mode.mixed_menu`, 'Mixed Mode')}
            >
              <div class={`${prefixCls}-block-checkbox__item`} onClick={handleLayoutChange(LayoutType.MixedMenu)}>
                <img src={IconLight} alt="mixedmenu" />
                {configs.layout === LayoutType.MixedMenu && (
                  <div class="selected-icon">
                    <Icon type="check" />
                  </div>
                )}
              </div>
            </Tooltip>
            <Tooltip
              title={configProvider.i18nRender(`${props.i18nKeyPrefix}.navigation_mode.sider_menu`, 'Sider Mode')}
            >
              <div class={`${prefixCls}-block-checkbox__item`} onClick={handleLayoutChange(LayoutType.SiderMenu)}>
                <img src={IconSiderMenu} alt="sidemenu" />
                {configs.layout === LayoutType.SiderMenu && (
                  <div class="selected-icon">
                    <Icon type="check" />
                  </div>
                )}
              </div>
            </Tooltip>
            <Tooltip title={configProvider.i18nRender(`${props.i18nKeyPrefix}.navigation_mode.top_menu`, 'Top Mode')}>
              <div class={`${prefixCls}-block-checkbox__item`} onClick={handleLayoutChange(LayoutType.TopMenu)}>
                <img src={IconTopmenu} alt="topmenu" />
                {configs.layout === LayoutType.TopMenu && (
                  <div class="selected-icon">
                    <Icon type="check" />
                  </div>
                )}
              </div>
            </Tooltip>
          </div>
          <div class="mt-6">
            <List split={false}>
              <List.Item>
                <Select
                  slot="actions"
                  size="small"
                  style="width: 80px;"
                  value={configs.contentWidth}
                  onChange={handleContentWidthChange}
                >
                  {configs.layout === LayoutType.TopMenu && (
                    <Select.Option value={ContentWidth.Fixed}>
                      {configProvider.i18nRender(`${props.i18nKeyPrefix}.content_width.fixed`, 'Fixed')}
                    </Select.Option>
                  )}
                  <Select.Option value={ContentWidth.Fluid}>
                    {configProvider.i18nRender(`${props.i18nKeyPrefix}.content_width.fluid`, 'Fluid')}
                  </Select.Option>
                </Select>
                <List.Item.Meta>
                  <template slot="title">
                    {configProvider.i18nRender(`${props.i18nKeyPrefix}.content_width.title`, 'Content Width')}
                  </template>
                </List.Item.Meta>
              </List.Item>
              <List.Item>
                <Switch
                  slot="actions"
                  size="small"
                  disabled={configs.layout === LayoutType.SiderMenu}
                  checked={configs.fixedHeader}
                  onChange={handleFixedHeader}
                />
                <List.Item.Meta>
                  <div
                    slot="title"
                    style={{ textDecoration: configs.layout === LayoutType.SiderMenu ? 'line-through' : 'unset' }}
                  >
                    {configProvider.i18nRender(`${props.i18nKeyPrefix}.fixed_header.title`, 'Fixed Header')}
                  </div>
                </List.Item.Meta>
              </List.Item>
              <List.Item>
                <Switch
                  slot="actions"
                  size="small"
                  disabled={!configs.fixedHeader}
                  checked={configs.autoHideHeader}
                  onChange={handleAutoHideHeader}
                />
                <List.Item.Meta>
                  <Tooltip
                    slot="title"
                    placement="left"
                    title={configProvider.i18nRender(
                      `${props.i18nKeyPrefix}.auto_hide_header.tooltip`,
                      'Available when fixed header is enabled',
                    )}
                  >
                    <div style={{ opacity: !configs.fixedHeader ? '0.5' : '1' }}>
                      {configProvider.i18nRender(
                        `${props.i18nKeyPrefix}.auto_hide_header.title`,
                        'Hide Header On Scroll',
                      )}
                    </div>
                  </Tooltip>
                </List.Item.Meta>
              </List.Item>
              <List.Item>
                <Switch
                  slot="actions"
                  size="small"
                  disabled={configs.layout === LayoutType.TopMenu}
                  checked={configs.fixSiderbar}
                  onChange={handleFixSiderbar}
                />
                <List.Item.Meta>
                  <div
                    slot="title"
                    style={{ textDecoration: configs.layout === LayoutType.TopMenu ? 'line-through' : 'unset' }}
                  >
                    {configProvider.i18nRender(`${props.i18nKeyPrefix}.fixed_sidebar.title`, 'Fixed Sidebar')}
                  </div>
                </List.Item.Meta>
              </List.Item>
            </List>
          </div>
        </div>
        <Divider />
        <div class="mb-6">
          <h3 class={`${prefixCls}__title`}>
            {configProvider.i18nRender(`${props.i18nKeyPrefix}.other_settings.title`, 'Other Settings')}
          </h3>
          <div>
            <List split={false}>
              <List.Item>
                <Switch slot="actions" size="small" checked={configs.colorWeak} onChange={handleColorWeak} />
                <List.Item.Meta>
                  <div slot="title">
                    {configProvider.i18nRender(`${props.i18nKeyPrefix}.weak_mode.title`, 'Weak Mode')}
                  </div>
                </List.Item.Meta>
              </List.Item>
              {/* <List.Item>
                  <Switch slot="actions" size="small" checked={configs.multiTab} onChange={handleMultiTab} />
                  <List.Item.Meta>
                    <div slot="title">{configProvider.i18nRender(`${props.i18nKeyPrefix}.multi_tab.title`, 'Multipe Tabs Mode')}</div>
                  </List.Item.Meta>
                </List.Item> */}
            </List>
          </div>
        </div>
        {slots.default && [<Divider />, slots.default()]}

        {!props.invisibleHandle && (
          <div slot="handle" class={`${prefixCls}__handle`} onClick={() => (visibleRef.value = !visibleRef.value)}>
            {visibleRef.value ? <Icon type="close" /> : <Icon type="setting" />}
          </div>
        )}
      </Drawer>
    );
  },
});

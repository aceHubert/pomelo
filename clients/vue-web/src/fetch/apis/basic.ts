import { defineRegistApi, gql } from '../graphql';

// Types
import type { TypedQueryDocumentNode } from '../graphql';

export enum OptionPresetKeys {
  /** 静态资源 base URL地址 */
  SiteUrl = 'siteurl',
  /** web URL 地址 */
  Home = 'home',
  /** 文章默认分类id */
  DefaultCategory = 'default_category',
  /** 当前启用的插件 */
  ActivePlugins = 'active_plugins',
  /** 缩略图宽度，默认：150 */
  ThumbnailSizeWidth = 'thumbnail_size_w',
  /** 缩略图高度，默认：150 */
  ThumbnailSizeHeight = 'thumbnail_size_h',
  /** 缩略图裁切，值：0/1，默认：1 */
  ThumbnailCrop = 'thumbnail_crop',
  /** 中图宽度，默认：300 */
  MediumSizeWidth = 'medium_size_w',
  /** 中图高度，默认：300 */
  MediumSizeHeight = 'medium_size_h',
  /** 大图宽度，默认：1200 */
  LargeSizeWidth = 'large_size_w',
  /** 大图高度，默认：1200 */
  LargeSizeHeight = 'large_size_h',
  /** 中大图宽度，默认：768 */
  MediumLargeSizeWidth = 'medium_large_size_w',
  /** 中大图高度：默认：0（auto） */
  MediumLargeSizeHeight = 'medium_large_size_h',
  /** 默认语言 */
  Locale = 'locale',
  /** -- Optional -- */
  PageOnFront = 'page_on_front',
}

/**
 * prefix 需要注册到window._ENV上
 */
export const useBasicApi = defineRegistApi('basic', {
  /**
   * 获取程序初始化自动加载配置
   */
  getAutoloadOptions: gql`
    query getAutoloadOptions {
      options: autoloadOptions
    }
  ` as TypedQueryDocumentNode<{ options: Record<string, string> }>,
  getOptionValue: gql`
    query getOptionValue($name: String!) {
      value: optionValue(name: $name)
    }
  ` as TypedQueryDocumentNode<{ value: string }, { name: string }>,
});

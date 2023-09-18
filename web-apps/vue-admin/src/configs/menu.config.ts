import IconDashboard from '@/assets/icons/dashboard.svg?inline';
import IconPictures from '@/assets/icons/pictures.svg?inline';
import IconCagetory from '@/assets/icons/category.svg?inline';
import IconTags from '@/assets/icons/tags.svg?inline';
import IconAddCell from '@/assets/icons/add-cell.svg?inline';
import IconDesign from '@/assets/icons/design.svg?inline';
import IconPage from '@/assets/icons/page.svg?inline';
import IconArticle from '@/assets/icons/article.svg?inline';
import IconSurvey from '@/assets/icons/survey.svg?inline';
import IconDetails from '@/assets/icons/details.svg?inline';
import IconComponent from '@/assets/icons/component.svg?inline';
import IconSettings from '@/assets/icons/settings.svg?inline';
import IconScope from '@/assets/icons/scope.svg?inline';

// Types
import type { MenuConfig } from '@/types';

export const getDefaultMenus = (): MenuConfig[] => [
  {
    key: 'dashboard',
    title: (i18nRender) => i18nRender('menu.dashboard', '仪表盘'),
    path: '/dashboard',
    alias: ['/'],
    icon: IconDashboard,
    position: 'top',
  },
  {
    key: 'posts-root',
    title: (i18nRender) => i18nRender('menu.post.root', '文章'),
    redirect: '/posts',
    position: 'top',
    icon: IconArticle,
    children: [
      {
        key: 'posts',
        title: (i18nRender) => i18nRender('menu.post.index', '所有文章'),
        path: '/posts',
        position: 'side',
        icon: IconArticle,
        children: [
          {
            key: 'posts-design',
            title: (i18nRender) => i18nRender('menu.post.design', '文章设计器'),
            path: '/posts/:id/edit',
            position: 'sub',
            display: false,
          },
        ],
      },
      {
        key: 'posts-add',
        title: (i18nRender) => i18nRender('menu.post.new', '写文章'),
        path: '/posts/add',
        position: 'side',
        icon: IconAddCell,
      },
      {
        key: 'category',
        title: (i18nRender) => i18nRender('menu.post.category', '类别'),
        path: '/categories',
        position: 'side',
        icon: IconCagetory,
      },
      {
        key: 'tag',
        title: (i18nRender) => i18nRender('menu.post.tag', '标签'),
        path: '/tags',
        position: 'side',
        icon: IconTags,
      },
    ],
  },
  {
    key: 'medias',
    title: (i18nRender) => i18nRender('menu.media', '所有媒体'),
    path: '/medias',
    position: 'top',
    icon: IconPictures,
  },
  {
    key: 'pages-root',
    title: (i18nRender) => i18nRender('menu.page.root', '页面'),
    redirect: '/pages',
    position: 'top',
    icon: IconPage,
    children: [
      {
        key: 'pages',
        title: (i18nRender) => i18nRender('menu.page.index', '所有页面'),
        path: '/pages',
        position: 'side',
        icon: IconPage,
        children: [
          {
            key: 'pages-design',
            title: (i18nRender) => i18nRender('menu.page.design', '页面设计器'),
            path: '/pages/:id/edit',
            position: 'sub',
            display: false,
          },
        ],
      },
      {
        key: 'pages-add',
        title: (i18nRender) => i18nRender('menu.page.new', '新建页面'),
        path: '/pages/add',
        position: 'side',
        icon: IconAddCell,
      },
    ],
  },
  {
    key: 'forms-root',
    title: (i18nRender) => i18nRender('menu.form.root', '表单'),
    redirect: '/forms',
    position: 'top',
    icon: IconSurvey,
    children: [
      {
        key: 'forms',
        title: (i18nRender) => i18nRender('menu.form.index', '所有表单'),
        path: '/forms',
        position: 'side',
        icon: IconSurvey,
        children: [
          {
            key: 'forms-design',
            title: (i18nRender) => i18nRender('menu.form.design', '表单设计器'),
            path: '/forms/:id/edit',
            position: 'sub',
            display: false,
          },
        ],
      },
      {
        key: 'forms-add',
        title: (i18nRender) => i18nRender('menu.form.new', '新建表单'),
        path: '/forms/add',
        position: 'side',
        icon: IconAddCell,
      },
    ],
  },
  {
    key: 'settings',
    title: (i18nRender) => i18nRender('menu.settings', '设置'),
    path: '/data-scope',
    icon: IconSettings,
    position: 'top',
    children: [
      {
        key: 'submodules-root',
        title: (i18nRender) => i18nRender('menu.submodule.root', '模块'),
        redirect: '/submodules',
        position: 'side',
        icon: IconComponent,
        display: false,
        children: [
          {
            key: 'submodules',
            title: (i18nRender) => i18nRender('menu.submodule.index', '所有模块'),
            path: '/submodules',
            position: 'side',
            children: [
              {
                key: 'submodules-details',
                title: (i18nRender) => i18nRender('menu.submodule。details', '模块详情'),
                path: '/submodules/:title',
                icon: IconDetails,
                position: 'sub',
              },
            ],
          },
        ],
      },
      {
        key: 'data-scope-root',
        title: (i18nRender) => i18nRender('menu.data-scope.root', '数据范围'),
        redirect: '/data-scope',
        position: 'side',
        icon: IconScope,
        children: [
          {
            key: 'data-scope',
            title: (i18nRender) => i18nRender('menu.data-scope.index', '所有数据范围管理'),
            path: '/data-scope',
            position: 'side',
            children: [
              {
                key: 'data-scope-design',
                title: (i18nRender) => i18nRender('menu.data-scope。design', '数据范围设计器'),
                path: '/data-scope/:id/edit',
                icon: IconDesign,
                position: 'sub',
                display: false,
              },
            ],
          },
          {
            key: 'data-scope-add',
            title: (i18nRender) => i18nRender('menu.data-scope.new', '新建数据范围'),
            path: '/data-scope/add',
            position: 'side',
          },
        ],
      },
    ],
  },
];

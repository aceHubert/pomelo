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
import type { MenuConfig } from 'antdv-layout-pro/types';

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
    path: '/posts',
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
        path: '/posts/create',
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
    title: (i18nRender) => i18nRender('menu.medias', '所有媒体'),
    path: '/medias',
    position: 'top',
    icon: IconPictures,
  },
  {
    key: 'pages-root',
    title: (i18nRender) => i18nRender('menu.page.root', '页面'),
    path: '/pages',
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
        path: '/pages/create',
        position: 'side',
        icon: IconAddCell,
      },
    ],
  },
  {
    key: 'forms-root',
    title: (i18nRender) => i18nRender('menu.form.root', '表单'),
    path: '/forms',
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
        path: '/forms/create',
        position: 'side',
        icon: IconAddCell,
      },
    ],
  },
  {
    key: 'settings',
    title: (i18nRender) => i18nRender('menu.settings', '设置'),
    path: '/data-scopes',
    icon: IconSettings,
    position: 'top',
    children: [
      {
        key: 'access_control',
        title: (i18nRender) => i18nRender('menu.access_control', '访问控制'),
        path: '/clients',
        icon: IconSettings,
        position: 'top',
        children: [
          {
            key: 'clients',
            title: (i18nRender) => i18nRender('menu.clients.list', '客户端'),
            path: '/clients',
            icon: IconSettings,
            position: 'side',
            children: [
              {
                key: 'client-details',
                title: (i18nRender) => i18nRender('menu.clients.details', '客户端详情'),
                path: '/clients/:clientId',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-grant-types',
                title: (i18nRender) => i18nRender('menu.clients.grant_types', '授权模式'),
                path: '/clients/:clientId/grant-types',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-scopes',
                title: (i18nRender) => i18nRender('menu.clients.scopes', '授权范围'),
                path: '/clients/:clientId/scopes',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-claims',
                title: (i18nRender) => i18nRender('menu.clients.claims', '声明'),
                path: '/clients/:clientId/claims',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-cors-origin',
                title: (i18nRender) => i18nRender('menu.clients.cors_origins', '跨域'),
                path: '/clients/:clientId/cors-origins',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-redirect-uris',
                title: (i18nRender) => i18nRender('menu.clients.redirect_uris', '登入回跳地址'),
                path: '/clients/:clientId/redirect-uris',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-post-logout-redirect-uris',
                title: (i18nRender) => i18nRender('menu.clients.post_logout_redirect_uris', '登出回跳地址'),
                path: '/clients/:clientId/post-logout-redirect-uris',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-secrets',
                title: (i18nRender) => i18nRender('menu.clients.secrets', '密匙'),
                path: '/clients/:clientId/secrets',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'client-secrets-generate',
                title: (i18nRender) => i18nRender('menu.clients.secrets_generate', '生成密匙'),
                path: '/clients/:clientId/secrets/generate',
                icon: IconDetails,
                position: 'sub',
                display: false,
              },
              {
                key: 'client-properties',
                title: (i18nRender) => i18nRender('menu.clients.properties', '自定义属性'),
                path: '/clients/:clientId/properties',
                icon: IconDetails,
                position: 'sub',
              },
            ],
          },
          {
            key: 'api-resources',
            title: (i18nRender) => i18nRender('menu.api_resources.list', 'API资源'),
            path: '/api-resources',
            icon: IconSettings,
            position: 'side',
            children: [
              {
                key: 'api-resources-details',
                title: (i18nRender) => i18nRender('menu.api_resources.details', '资源详情'),
                path: '/api-resources/:id',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'api-scopes',
                title: (i18nRender) => i18nRender('menu.api_resources.scopes', '授权范围'),
                path: '/api-resources/:id/scopes',
                icon: IconDetails,
                position: 'sub',
                children: [
                  {
                    key: 'api-scope-claims',
                    title: (i18nRender) => i18nRender('menu.api_resources.scope_claims', '授权范围声明'),
                    path: '/api-scopes/:scopeId/claims',
                    icon: IconDetails,
                    position: 'sub',
                  },
                ],
              },
              {
                key: 'api-claims',
                title: (i18nRender) => i18nRender('menu.api_resources.claims', '声明'),
                path: '/api-resources/:id/claims',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'api-secrets',
                title: (i18nRender) => i18nRender('menu.api_resources.secrets', '密匙'),
                path: '/api-resources/:id/secrets',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'api-secrets-generate',
                title: (i18nRender) => i18nRender('menu.api_resources.secrets_generate', '生成密匙'),
                path: '/api-resources/:id/secrets/generate',
                icon: IconDetails,
                position: 'sub',
                display: false,
              },
              {
                key: 'api-properties',
                title: (i18nRender) => i18nRender('menu.api_resources.properties', '自定义属性'),
                path: '/api-resources/:id/properties',
                icon: IconDetails,
                position: 'sub',
              },
            ],
          },
          {
            key: 'identity-resources',
            title: (i18nRender) => i18nRender('menu.identity_resources.list', 'Identity资源'),
            path: '/identity-resources',
            icon: IconSettings,
            position: 'side',
            children: [
              {
                key: 'identity-resource-details',
                title: (i18nRender) => i18nRender('menu.identity_resources.details', '资源详情'),
                path: '/identity-resources/:id',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'identity-claims',
                title: (i18nRender) => i18nRender('menu.identity_resources.claims', '声明'),
                path: '/identity-resources/:id/claims',
                icon: IconDetails,
                position: 'sub',
              },
              {
                key: 'identity-properties',
                title: (i18nRender) => i18nRender('menu.identity_resources.properties', '自定义属性'),
                path: '/identity-resources/:id/properties',
                icon: IconDetails,
                position: 'sub',
              },
            ],
          },
        ],
      },
      {
        key: 'system-setting',
        title: (i18nRender) => i18nRender('menu.system_setting', '系统设置'),
        path: '/data-scopes',
        icon: IconSettings,
        position: 'top',
        children: [
          {
            key: 'submodules-root',
            title: (i18nRender) => i18nRender('menu.submodule.root', '模块'),
            path: '/submodules',
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
            path: '/data-scope',
            position: 'side',
            icon: IconScope,
            children: [
              {
                key: 'data-scopes',
                title: (i18nRender) => i18nRender('menu.data-scope.index', '所有数据范围管理'),
                path: '/data-scopes',
                position: 'side',
                children: [
                  {
                    key: 'data-scope-design',
                    title: (i18nRender) => i18nRender('menu.data_scope。design', '数据范围设计器'),
                    path: '/data-scopes/:id/edit',
                    icon: IconDesign,
                    position: 'sub',
                    display: false,
                  },
                ],
              },
              {
                key: 'data-scope-add',
                title: (i18nRender) => i18nRender('menu.data-scope.new', '新建数据范围'),
                path: '/data-scopes/create',
                position: 'side',
              },
            ],
          },
        ],
      },
    ],
  },
];

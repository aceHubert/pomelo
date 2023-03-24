// Types
import { MenuConfig } from '@/types';

export const getDefaultMenus = (): MenuConfig[] => [
  {
    key: 'dashboard',
    title: (i18nRender) => i18nRender('menu.dashboard', '仪表盘'),
    path: '/dashboard',
    alias: ['/'],
    icon: 'dashboard',
    position: 'top',
  },
  {
    key: 'content-root',
    title: (i18nRender) => i18nRender('menu.content-root', '内容'),
    icon: 'build',
    position: 'top',
    children: [
      {
        key: 'taxonomy',
        title: (i18nRender) => i18nRender('menu.content.taxonomy', '类别'),
        path: '/taxonomy/:id',
        display: false,
      },
      {
        key: 'template-root',
        title: (i18nRender) => i18nRender('menu.content.template', '模版'),
        redirect: '/pages',
        icon: 'build',
        position: 'top',
        children: [
          {
            key: 'pages-root',
            title: (i18nRender) => i18nRender('menu.content.pages', '页面'),
            redirect: '/pages',
            icon: 'build',
            position: 'side',
            children: [
              {
                key: 'pages',
                title: (i18nRender) => i18nRender('menu.content.pages_index', '页面管理'),
                path: '/pages',
                icon: 'table',
                position: 'side',
                children: [
                  {
                    key: 'pages-design',
                    title: (i18nRender) => i18nRender('menu.content.pages_design', '页面设计'),
                    path: '/pages/:id/edit',
                    icon: 'project',
                    position: 'sub',
                    display: false,
                  },
                ],
              },
              {
                key: 'pages-add',
                title: (i18nRender) => i18nRender('menu.content.pages_add', '新建页面'),
                path: '/pages/add',
                icon: 'plus-square',
                position: 'side',
              },
            ],
          },
          {
            key: 'forms-root',
            title: (i18nRender) => i18nRender('menu.content.forms', '表单'),
            redirect: '/forms',
            icon: 'build',
            position: 'side',
            children: [
              {
                key: 'forms',
                title: (i18nRender) => i18nRender('menu.content.forms_index', '表单管理'),
                path: '/forms',
                icon: 'table',
                position: 'side',
                children: [
                  {
                    key: 'forms-design',
                    title: (i18nRender) => i18nRender('menu.content.forms_design', '表单设计'),
                    path: '/forms/:id/edit',
                    icon: 'project',
                    position: 'sub',
                    display: false,
                  },
                ],
              },
              {
                key: 'forms-add',
                title: (i18nRender) => i18nRender('menu.content.forms_add', '新建表单'),
                path: '/forms/add',
                icon: 'plus-square',
                position: 'side',
              },
            ],
          },
          {
            key: 'posts-root',
            title: (i18nRender) => i18nRender('menu.content.posts', '内容'),
            redirect: '/posts',
            icon: 'build',
            position: 'side',
            children: [
              {
                key: 'posts',
                title: (i18nRender) => i18nRender('menu.content.posts_index', '内容管理'),
                path: '/posts',
                icon: 'table',
                position: 'side',
                children: [
                  {
                    key: 'posts-design',
                    title: (i18nRender) => i18nRender('menu.content.posts_design', '内容设计'),
                    path: '/posts/:id/edit',
                    icon: 'project',
                    position: 'sub',
                    display: false,
                  },
                ],
              },
              {
                key: 'posts-add',
                title: (i18nRender) => i18nRender('menu.content.posts_add', '新建内容'),
                path: '/posts/add',
                icon: 'plus-square',
                position: 'side',
              },
            ],
          },
          {
            key: 'data-scope-root',
            title: (i18nRender) => i18nRender('menu.content.data-scope', '数据范围'),
            redirect: '/data-scope',
            icon: 'build',
            position: 'side',
            children: [
              {
                key: 'data-scope',
                title: (i18nRender) => i18nRender('menu.content.data-scope_index', '数据范围管理'),
                path: '/data-scope',
                icon: 'table',
                position: 'side',
                children: [
                  {
                    key: 'data-scope-design',
                    title: (i18nRender) => i18nRender('menu.content.data-scope_design', '数据范围设计'),
                    path: '/data-scope/:id/edit',
                    icon: 'project',
                    position: 'sub',
                    display: false,
                  },
                ],
              },
              {
                key: 'data-scope-add',
                title: (i18nRender) => i18nRender('menu.content.data-scope_add', '新建数据范围'),
                path: '/data-scope/add',
                icon: 'plus-square',
                position: 'side',
              },
            ],
          },
        ],
      },
      {
        key: 'submodules-root',
        title: (i18nRender) => i18nRender('menu.content.submodules', '模块'),
        redirect: '/submodules',
        icon: 'build',
        position: 'top',
        children: [
          {
            key: 'submodules',
            title: (i18nRender) => i18nRender('menu.content.submodules_index', '模块管理'),
            path: '/submodules',
            icon: 'tags',
            position: 'side',
            children: [
              {
                key: 'submodules-details',
                title: (i18nRender) => i18nRender('menu.content.submodules_details', '模块详情'),
                path: '/submodules/:title',
                icon: 'project',
                position: 'sub',
              },
            ],
          },
        ],
      },
    ],
  },
];

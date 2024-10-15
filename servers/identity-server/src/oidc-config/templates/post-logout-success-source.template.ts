import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';

export const renderPostLogoutSuccessSourceTemplate = ({
  globalPrefix,
  pageTitle = 'Sign-out Success',
  content,
  primaryColor,
}: {
  globalPrefix: string;
  pageTitle?: string;
  content: {
    title: string;
    description: string;
  };
  primaryColor?: string;
}) => {
  return `<!DOCTYPE html>
  <head>
  <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
    <link rel="icon" type="image/x-icon" href="${globalPrefix}/favicon.ico" />
    <link rel="shortcut icon" type="image/x-icon" href="${globalPrefix}/favicon.ico" />
    <title>${pageTitle}</title>
    ${
      process.env.NODE_ENV === 'production'
        ? `<link rel="stylesheet" href="${globalPrefix}/style/index.min.css" />
          <link rel="stylesheet" href="${globalPrefix}/style/container.min.css" />`
        : `<link rel="stylesheet" href="${globalPrefix}/style/index.css" />
          <link rel="stylesheet" href="${globalPrefix}/style/container.css" />`
    }
    ${primaryColor ? renderPrimaryStyle(primaryColor) : ''}
  </head>
  <body>
    <main class="container">
      <div class="wrapper">
        <h1 class="title">${content.title}</h1>
        <p class="description">${content.description}</p>
      </div>
    </main>
  </body>
  </html>`;
};

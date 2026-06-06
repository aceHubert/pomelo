import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';

export const renderExceptionTemplate = ({
  assetsBaseURL,
  pageTitle = 'An error occurred',
  content,
  primaryColor,
}: {
  assetsBaseURL: string;
  pageTitle?: string;
  content: {
    title: string;
    description: string;
  };
  primaryColor?: string;
}) => {
  return `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
            <link rel="icon" type="image/x-icon" href="${assetsBaseURL}favicon.ico" />
            <link rel="shortcut icon" type="image/x-icon" href="${assetsBaseURL}favicon.ico" />
            <title>${pageTitle}</title>
            <link rel="stylesheet" href="${assetsBaseURL}vendor/bootstrap/dist/css/bootstrap.min.css" />
            ${
              process.env.NODE_ENV === 'production'
                ? `<link rel="stylesheet" href="${assetsBaseURL}style/bootstrap-theme.min.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/liquid-glass.min.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/index.min.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/container.min.css" />`
                : `<link rel="stylesheet" href="${assetsBaseURL}style/bootstrap-theme.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/liquid-glass.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/index.css" />
                  <link rel="stylesheet" href="${assetsBaseURL}style/container.css" />`
            }
            ${primaryColor ? renderPrimaryStyle(primaryColor) : ''}
          </head>
          <body>
            <main class="container">
              <div class="wrapper liquid-glass liquid-glass-card">
                <h1 class="title">${content.title}</h1>
                <p class="description">${content.description}</p>
              </div>
            </main>
            ${
              process.env.NODE_ENV === 'production'
                ? `<script src="${assetsBaseURL}js/gemini-2-0-gradient.min.js"></script>
                  <script src="${assetsBaseURL}js/liquid-glass.min.js"></script>`
                : `<script src="${assetsBaseURL}js/gemini-2-0-gradient.js"></script>
                  <script src="${assetsBaseURL}js/liquid-glass.js"></script>`
            }
          </body>
        </html>
        `;
};

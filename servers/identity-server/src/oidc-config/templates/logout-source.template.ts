import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';

export const renderLogoutSourceTempate = ({
  assetsBaseURL,
  pageTitle = 'Logout Request',
  content,
  primaryColor,
  locales,
}: {
  assetsBaseURL: string;
  pageTitle?: string;
  content: {
    title: string;
    form: string;
    confirmBtnText: string;
    cancelBtnText: string;
  };
  primaryColor?: string;
  locales?: string;
}) => {
  return `<!DOCTYPE html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
              <link rel="icon" type="image/x-icon" href="${assetsBaseURL}favicon.ico" />
              <link rel="shortcut icon" type="image/x-icon" href="${assetsBaseURL}favicon.ico" />
              <title>${pageTitle}</title>
              <script>
                (function () {
                  var mode = 'system';
                  try {
                    mode = localStorage.getItem('__POMELO_THEME__') || mode;
                  } catch (error) {}
                  if (['system', 'dark', 'light'].indexOf(mode) < 0) mode = 'system';
                  document.documentElement.setAttribute('data-theme', mode);
                })();
              </script>
              <link rel="stylesheet" href="${assetsBaseURL}vendor/bootstrap/dist/css/bootstrap.min.css" />
              ${
                process.env.NODE_ENV === 'production'
                  ? `<link rel="stylesheet" href="${assetsBaseURL}style/bootstrap-theme.min.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/liquid-glass.min.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/index.min.css" />                    
                    <link rel="stylesheet" href="${assetsBaseURL}style/container.min.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/logout.min.css" />`
                  : `<link rel="stylesheet" href="${assetsBaseURL}style/bootstrap-theme.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/liquid-glass.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/index.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/container.css" />
                    <link rel="stylesheet" href="${assetsBaseURL}style/logout.css" />`
              }
              ${primaryColor ? renderPrimaryStyle(primaryColor) : ''}
            </head>
            <body>
              <div id="app">
                <main class="wrapper-placeholder">
                  ${locales ?? ''}
                  <div class="wrapper liquid-glass liquid-glass-card">
                    <h1 class="title">${content.title}</h1>
                    ${content.form}
                    <div id="actions"">
                      <button autofocus type="submit" class="action-button" form="op.logoutForm" value="yes" name="logout">${
                        content.confirmBtnText
                      }</button>
                      <button type="submit" class="action-button secondary" form="op.logoutForm">${
                        content.cancelBtnText
                      }</button>
                    </div>
                  </div>
                </main>
              </div>
              ${
                process.env.NODE_ENV === 'production'
                  ? `<script src="${assetsBaseURL}js/gemini-2-0-gradient.min.js"></script>
                    <script src="${assetsBaseURL}js/liquid-glass.min.js"></script>
                    <script src="${assetsBaseURL}js/globals.min.js"></script>`
                  : `<script src="${assetsBaseURL}js/gemini-2-0-gradient.js"></script>
                    <script src="${assetsBaseURL}js/liquid-glass.js"></script>
                    <script src="${assetsBaseURL}js/globals.js"></script>`
              }
            </body>
            </html>`;
};

export const renderSilentLogoutSourceTemplate = ({ form }: { form: string }) => {
  return `<!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8" />
              <title>Logout</title>
            </head>
            <body>
              ${form}
              <script>
                (function () {
                  var logoutForm = document.getElementById('op.logoutForm');
                  if (!logoutForm) return;

                  var logoutInput = document.createElement('input');
                  logoutInput.type = 'hidden';
                  logoutInput.name = 'logout';
                  logoutInput.value = 'yes';
                  logoutForm.appendChild(logoutInput);

                  HTMLFormElement.prototype.submit.call(logoutForm);
                })();
              </script>
            </body>
            </html>`;
};

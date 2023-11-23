import background from './helpers/background.helper';
import icon from './helpers/icon.helper';

export type PresetIconName = 'warning' | 'exit' | '404';

export type RedirectOptions = {
  link: string;
} & (
  | {
      /** Whether the page will auto-redirect to another uri after x seconds */
      type: 'auto';
    }
  | {
      label: string;
      type: 'button';
    }
);

export function renderMsgPage(context: {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: PresetIconName | string;
  redirect?: RedirectOptions;
  backLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  actionsAlign?: 'left' | 'right' | 'center';
}) {
  return `<!DOCTYPE html>
  <html>
  <head>
      <title>${context.title}</title>
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimal-ui" />
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="content-language" content="en" />
      ${
        context.redirect?.type === 'auto'
          ? '<meta http-equiv="refresh" content="3; url = \'' + context.redirect.link + '\'" />'
          : ''
      }
      <link href=“https://use.typekit.net/qwi6aba.css” rel=“stylesheet” />
      <style type="text/css">
          body {
              height: 100vh;
              margin: 0;
              background: url(${background('dotted-bg')}) no-repeat right bottom;
              background-size: 35%;
          }

          .container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100vh;
              width: 80vw;
              align-items: center;
              margin: 0 auto;
          }

          .container>div {
              margin: 3%;
          }

          .title {
              font: 700 32px/20px Futura EF, futura-pt, Futura, Hind, Verdana, Arial Black, sans-serif;
              line-height: 32px;
          }

          .subtitle {
              font: 700 18px/21px Futura EF, futura-pt, Futura, Hind, Verdana, Arial Black, sans-serif;
              color: #9f9f9f;
          }

          .description {
              font: 300 14px/21px Roboto, roboto, Helvetica Neue, sans-serif;
          }

          span {
              font-weight: 500;
          }

          #actions {
              margin-top: 32px;
          }

          .action-button {
              background-color: ${context.primaryColor || '#694ed6'} ;
              color: white;
              border-radius: 18px;
              min-width: 64px;
              line-height: 36px;
              padding: 0 16px;
              border: none;
              cursor: pointer;
          }

          .action-button + .action-button {
              margin-left: 16px;
          }

          .action-button.secondary {
              color: rgba(0,0,0,0.85);
              background-color: ${context.secondaryColor || '#cccccc'};
          }

          .icon-msg,
          .icon-msg svg {
              height: 30vh;
          }

          @media screen and (max-width: 768px) {
              body {
                  background-size: 60%;
              }
          }

          @media screen and (min-width: 1180px) {
            body {
                background-size: 25%;
            }
        }
      </style>
  </head>

  <body>
      <div class="container">
          ${context.icon ? `<div class="icon-msg"><img src="${icon(context.icon)}" alt="icon"/></div>` : ''}
          <div class="text">
              <h1 class="title">${context.title}</h1>
              ${!!context.subtitle ? `<h2 class="subtitle">${context.subtitle}</h2>` : ''}
              ${!!context.description ? `<p class="description">${context.description}</p>` : ''}
              <div id="actions" style="text-align: ${context.actionsAlign ?? 'left'}">
                ${
                  context.backLabel
                    ? `<button class='action-button ${
                        context.redirect?.type === 'button' ? 'secondary' : ''
                      }' onclick='back()'>${context.backLabel}</button>`
                    : ''
                }
                ${
                  context.redirect?.type === 'button'
                    ? `<button class='action-button' onclick='proceed()'>${context.redirect.label}</button>`
                    : ''
                }
              </div>
          </div>
      </div>

      ${
        !!context.backLabel
          ? `<script>
            function back() {
                window.history.go(-1);
                return false;
            }
        </script>`
          : ''
      }

      ${
        !!context.redirect
          ? `<script>
            function proceed() {
                window.location.href = '${context.redirect.link}';
            }
        </script>`
          : ''
      }
  </body>
  </html>`;
}

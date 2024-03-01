/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const bannerShown = sessionStorage.getItem('__BANNER_SHOWN__') === '1';
!bannerShown &&
  console.log(
    `%c ________  ________  _____ ______   _______   ___       ________
%c|\\   __  \\|\\   __  \\|\\   _ \\  _   \\|\\  ___ \\ |\\  \\     |\\   __  \\
%c\\ \\  \\|\\  \\ \\  \\|\\  \\ \\  \\\\\\__\\ \\  \\ \\   __/|\\ \\  \\    \\ \\  \\|\\  \\
 %c\\ \\   ____\\ \\  \\\\\\  \\ \\  \\\\|__| \\  \\ \\  \\_|/_\\ \\  \\    \\ \\  \\\\\\  \\
  %c\\ \\  \\___|\\ \\  \\\\\\  \\ \\  \\    \\ \\  \\ \\  \\_|\\ \\ \\  \\____\\ \\  \\\\\\  \\
   %c\\ \\__\\    \\ \\_______\\ \\__\\    \\ \\__\\ \\_______\\ \\_______\\ \\_______\\
    %c\\|__|     \\|_______|\\|__|     \\|__|\\|_______|\\|_______|\\|_______|
  `,
    'color:#ff0000',
    'color:#ff3b00',
    'color:#ff7500',
    'color:#FFAD00',
    'color: #FEDA00',
    'color:#D0FD00',
    'color:#93FF00',
  );
sessionStorage.setItem('__BANNER_SHOWN__', '1');

/**
 * 末尾添加 "/"
 * @param {string} path
 */
function trailingSlash(path) {
  return path.endsWith('/') ? path : path + '/';
}

/**
 * localtion.replace 兼容
 * @param {string} url
 */
function locationReplace(url) {
  if (history.replaceState) {
    try {
      history.replaceState(null, document.title, url);
      location.reload();
    } catch (error) {
      location.replace(url);
    }
  } else {
    location.replace(url);
  }
}

/**
 * 绝对路径跳转
 * @param {string} url
 * @param {boolean} replace
 */
function absoluteGo(url, replace) {
  try {
    if (replace) {
      locationReplace(url);
    } else {
      window.location.assign(url);
    }
  } catch (e) {
    window.location.href = url;
  }
}

/*
 * 判断是否为绝对路径
 * @param {string} url
 */
function isAbsoluteUrl(url) {
  return /^(https?:\/\/|\/\/)[\w.]+\/?/gi.test(url);
}

/**
 * 获取url参数
 * @param {string?} key
 */
function getUrlParams(key) {
  const args = {};
  const pairs = location.search.substring(1).split('&');
  for (const i = 0; i < pairs.length; i++) {
    const pos = pairs[i].indexOf('=');
    if (pos === -1) {
      continue;
    }
    args[pairs[i].substring(0, pos)] = decodeURIComponent(pairs[i].substring(pos + 1));
  }
  return args[key];
}

/**
 * 路径添加参数
 * @param {string} url
 * @param {object} params
 */
function appendParams(url, params) {
  let baseWithSearch = url.split('#')[0];
  let hash = url.split('#')[1];
  for (let i = 0; i < params.length; i++) {
    if (params[i].value !== undefined) {
      let newParam = params[i].key + '=' + params[i].value;
      if (baseWithSearch.indexOf('?') > 0) {
        let oldParamReg = new RegExp(params[i].key + '=[-\\w]{0,40}', 'g');
        if (oldParamReg.test(baseWithSearch)) {
          baseWithSearch = baseWithSearch.replace(oldParamReg, newParam);
        } else {
          baseWithSearch += '&' + newParam;
        }
      } else {
        baseWithSearch += '?' + newParam;
      }
    }
  }
  if (hash) {
    url = baseWithSearch + '#' + hash;
  } else {
    url = baseWithSearch;
  }
  return url;
}

function showToast(message, type, $toastEl) {
  if ((!$toastEl || !$toastEl.length) && !($toastEl = $('#errorToast')).length) {
    $toastEl = $(`<div class="toast-container position-absolute p-3 top-0 start-50 translate-middle-x">
      <div id="errorToast" class="toast ${
        type === 'success' ? 'green' : 'red'
      } lighten-5" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
        ${
          type === 'success'
            ? `<img src="../icon/check-fill.svg" class="pr-1" style="width: 1.5rem; height: 1.5rem;
              filter: invert(57%) sepia(25%) saturate(7387%) hue-rotate(124deg) brightness(105%) contrast(80%)"
              alt="Success">`
            : `<img src="../icon/close-fill.svg" class="pr-1" style="width: 1.5rem; height: 1.5rem;
              filter: invert(14%) sepia(80%) saturate(4823%) hue-rotate(350deg) brightness(125%) contrast(95%)"
              alt="Error">`
        }
          <span class="content">${message}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
    </div>`)
      .appendTo('body')
      .find('#errorToast');
  } else {
    $($('.toast-body .content', $toastEl).get().concat($('.toast-body', $toastEl).get()))
      .first()
      .html(message);
  }

  const toast = bootstrap.Toast.getOrCreateInstance($toastEl);
  toast.show();
  return () => toast.hide();
}

function showPopover($targetEl, message, config) {
  const popover = bootstrap.Popover.getOrCreateInstance(
    $targetEl,
    Object.assign(
      {
        content: message,
        trigger: 'manual',
        offset: $targetEl.is(':checkbox') ? [-15, 12] : [0, 12],
        popperConfig: function (defaultBsPopperConfig) {
          return Object.assign(defaultBsPopperConfig, {
            // bootstrap 5.1.0 不支持部分位置
            placement: config?.placement || 'bottom-start',
          });
        },
      },
      config,
    ),
  );
  popover.show();
  $targetEl.focus();
  return () => popover.hide();
}

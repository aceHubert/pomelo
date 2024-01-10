/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

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
  var args = {};
  var pairs = location.search.substring(1).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pos = pairs[i].indexOf('=');
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

// https://qiankun.umijs.org/zh/faq#vue-router-%E6%8A%A5%E9%94%99-uncaught-typeerror-cannot-redefine-property-router
if (window.Vue) {
  window.Vue2 = window.Vue;
  delete window.Vue;
}

// import Vue, { VueConstructor } from 'vue';

export function warn(condition: boolean, format: string, ...args: any[]) {
  if (format === undefined) {
    throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
  }

  if (!condition) {
    let argIndex = 0;
    const message =
      '[@template]: ' +
      format.replace(/%s/g, function () {
        return args[argIndex++];
      });
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }
}

// TODO: 移出 VUE 相关引用
// export function vueWarn(condition: boolean, msg: string, vm?: InstanceType<VueConstructor>) {
//   let fn;
//   if (!Vue?.util) {
//     fn = () => warn(false, msg);
//   } else {
//     fn = () => Vue.util.warn(msg, vm);
//   }
//   !condition && fn();
// }

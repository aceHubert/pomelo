import Vue from 'vue';
import { PiniaVuePlugin, createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

Vue.use(PiniaVuePlugin);

export const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export * from './utils';
export * from './app';

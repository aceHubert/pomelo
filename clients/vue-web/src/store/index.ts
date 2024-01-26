import Vue from 'vue';
import { PiniaVuePlugin, createPinia } from 'pinia';

Vue.use(PiniaVuePlugin);

export const pinia = createPinia();

export * from './utils';
export * from './app';

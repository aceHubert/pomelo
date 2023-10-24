import type { ComponentOptions } from 'vue';
import type Vue from 'vue';

export type Plugin = (app: ComponentOptions<Vue>, inject: (key: string, value: any) => void) => void;

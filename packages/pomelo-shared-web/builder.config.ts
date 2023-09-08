import type { IBuilderConfig } from '../../scripts/build/types';

export const BuilderConfig: IBuilderConfig = {
  externals: {
    '@ace-fetch/core': 'AceFetch.Core',
    '@ace-fetch/vue': 'AceFetch.Vue',
    '@ace-util/core': 'AceUtil.Core',
    pinia: 'Pinia',
  },
};

import moment from 'moment';

import type { MomentInput } from 'moment';

export function formatDate(v: MomentInput, format = 'YYYY-MM-DD', locale = 'zh-CN') {
  return v ? moment(v).locale(locale).format(format) : '';
}

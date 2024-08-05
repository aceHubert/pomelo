import type { FetchClient } from '@ace-fetch/core';
import type { ClauseValueType } from './constants';

export type ClauseField = {
  label: string;
  fieldName: string;
  valueType: ClauseValueType;
  // #region https://1x.antdv.com/components/date-picker-cn/#API
  /** 日期选择框value格式，默认为：yyyy-MM-DD */
  dateFormat?: string;
  /** 日期选择框显示时间，默认为：false*/
  dateShowTime?: boolean;
  // #endregion
  /** 验证输入值，自定义错误信息返回Error类型 */
  validate?: (value: any) => boolean | Error;
};

export type ValueSourceItem = { value: string | number; label: string };

export type RemoteValueSourceFn = (request: FetchClient['get']) => Promise<ValueSourceItem[]>;

export type ClauseFieldConfig = Array<
  ClauseField & {
    valueSource?: string | ValueSourceItem[] | RemoteValueSourceFn;
    [key: string]: any;
  }
>;

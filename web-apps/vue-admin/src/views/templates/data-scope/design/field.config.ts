import { ClauseValueType } from '../constants';
import type { ClauseFieldConfig } from '../types';

export const FieldConfig: ClauseFieldConfig = [
  { valueType: ClauseValueType.String, fieldName: 'User.StaffId', id: 3, label: '工号' },
  {
    valueType: ClauseValueType.Byte,
    fieldName: 'User.Gender',
    id: 2,
    label: '性别',
    valueSource: [
      { value: 0, label: '男' },
      { value: 1, label: '女' },
    ],
  },
  {
    valueType: ClauseValueType.SByte,
    fieldName: 'User.StaffLevel',
    id: 4,
    label: '职级',
    valueSource: [
      { value: 0, label: '职级1' },
      { value: 1, label: '职级2' },
      { value: 2, label: '职级3' },
    ],
  },
  { valueType: ClauseValueType.DateTime, fieldName: 'User.Birthday', id: 5, label: '出生日期' },
  { valueType: ClauseValueType.Int32, fieldName: 'User.Age', id: 6, label: '年龄' },
  { valueType: ClauseValueType.Byte, fieldName: 'User.MarrieStatus', id: 7, label: '婚否' },
  { valueType: ClauseValueType.Byte, fieldName: 'User.WorkStatus', id: 10, label: '在职状态' },
  { valueType: ClauseValueType.DateTime, fieldName: 'User.EmploymentDate', id: 11, label: '入职日期' },
];

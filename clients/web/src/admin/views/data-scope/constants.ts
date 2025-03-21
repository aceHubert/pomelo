export const TemplateType = 'data-scope';

export enum ClauseLogical {
  Or = 0, // 或
  And = 1, // 与
}

export enum ClauseOperator {
  Equal = 0, // =
  Unequal = 1, // <>
  GreaterThan = 2, // >
  LessThan = 3, // <
  GreaterThanAndEqual = 4, // >=
  LessThanAndEqual = 5, // <=
  Includes = 6, // 包含
}

export enum ClauseValueType {
  String = 0,
  Char = 1,
  Boolean = 2,
  DateTime = 3,
  Byte = 4,
  SByte = 5,
  Decimal = 6,
  Double = 7,
  Single = 8,
  Int16 = 9,
  Int32 = 10,
  Int64 = 11,
  UInt16 = 12,
  UInt32 = 13,
  UInt64 = 14,
  BigInteger = 15,
}

export enum GroupState {
  Placeholder = 'placeholder',
  Start = 'start',
  End = 'end',
}

/**
 * 配置自动加载
 */
export enum OptionAutoload {
  Yes = 'yes',
  No = 'no',
}

export interface OptionAttributes {
  id: number;
  optionName: string;
  optionValue: string;
  autoload: OptionAutoload;
}

export interface OptionCreationAttributes extends Optional<OptionAttributes, 'id' | 'autoload'> {}

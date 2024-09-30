import { IRAMActionDefine } from '@ace-pomelo/nestjs-ram-authorization';

export class OptionAction implements IRAMActionDefine {
  static readonly List = 'option.list';
  static readonly Create = 'option.create';
  static readonly Update = 'option.update';
  static readonly Delete = 'option.delete';
}

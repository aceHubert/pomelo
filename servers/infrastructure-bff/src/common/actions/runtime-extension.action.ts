import { IRAMActionDefine } from '@ace-nestjs/ram-authorization';

export class RuntimeExtensionAction implements IRAMActionDefine {
  static readonly List = 'runtime-extension.list';
  static readonly Update = 'runtime-extension.update';
  static readonly Restart = 'runtime-extension.restart';
}

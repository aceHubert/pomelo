import { Logger } from '@nestjs/common';
import { ResolveTree } from 'graphql-parse-resolve-info';

export abstract class BaseResolver {
  protected logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  /**
   * 获取字段名
   * @param root
   */
  getFieldNames(root: { [key: string]: ResolveTree }) {
    return Object.keys(root).map((key) => root[key].name || key);
  }
}

// Types
import { ResolveTree } from '../decorators/field.decorator';

export abstract class BaseResolver {
  /**
   * 获取字段名
   * @param root
   */
  getFieldNames(root: { [key: string]: ResolveTree }) {
    return Object.keys(root).map((key) => root[key].name || key);
  }
}

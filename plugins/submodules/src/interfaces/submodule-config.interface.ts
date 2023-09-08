export class SubModuleConfig {
  /**
   * Submodule name
   */
  moduleName!: string;

  /**
   * Submodule entry
   */
  entry!: string;

  /**
   * extract styles
   */
  styles?: string | string[];

  /**
   * Submodule args schema
   */
  args?: Record<string, unknown>;

  /**
   * other fields
   */
  [key: string]: any;
}

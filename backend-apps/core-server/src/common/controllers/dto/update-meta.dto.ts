export class UpdateMetaDto {
  /**
   * Meta value
   */
  metaValue?: string;

  /**
   * Create if not exists
   * @default false
   */
  createIfNotExists?: boolean;
}

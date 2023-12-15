import { Type } from '@nestjs/common';
import { ApiResponseProperty } from '@nestjs/swagger';

export function PagedResponse<IPagedItemModel>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  pagedItemModel: Type<IPagedItemModel> | String | Number | Boolean,
) {
  abstract class PagedClass {
    /**
     * Paged data items
     */
    @ApiResponseProperty({ type: [pagedItemModel] })
    rows!: IPagedItemModel[];

    /**
     * Data total count
     */
    @ApiResponseProperty()
    total!: number;
  }
  return PagedClass;
}

export abstract class Count {
  /**
   * Count
   */
  count!: number;
}

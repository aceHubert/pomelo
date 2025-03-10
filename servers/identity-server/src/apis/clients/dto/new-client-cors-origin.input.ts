import { InputType } from '@nestjs/graphql';
import { NewClientCorsOriginValidator } from './new-client-cros-origin.validator';

@InputType({ description: 'New client claim input' })
export class NewClientCorsOriginInput extends NewClientCorsOriginValidator {
  /**
   * Origin
   */
  origin!: string;
}

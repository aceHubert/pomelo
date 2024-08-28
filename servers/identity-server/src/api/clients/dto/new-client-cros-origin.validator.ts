import { IsDefined, IsUrl } from 'class-validator';
import { NewClientCorsOriginInput } from '@/datasource';

export abstract class NewClientCorsOriginValidator implements NewClientCorsOriginInput {
  @IsDefined()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  abstract origin: string;
}

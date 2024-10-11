import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewApiScopeClaimInput } from '@/datasource';

export abstract class NewApiScopeClaimValidator implements NewApiScopeClaimInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract type: string;
}

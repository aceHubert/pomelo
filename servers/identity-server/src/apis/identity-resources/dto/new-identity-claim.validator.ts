import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewIdentityClaimInput } from '@/datasource';

export abstract class NewIdentityClaimValidator implements NewIdentityClaimInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract type: string;
}

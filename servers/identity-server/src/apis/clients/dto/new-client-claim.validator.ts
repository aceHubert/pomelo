import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewClientClaimInput } from '@/datasource';

export abstract class NewClientClaimValidator implements NewClientClaimInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract type: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract value: string;
}

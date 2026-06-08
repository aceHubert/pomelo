import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewApiClaimInput } from '@/datasource';

export abstract class NewApiClaimValidator implements NewApiClaimInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract type: string;
}

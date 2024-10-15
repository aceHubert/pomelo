import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewClientScopeInput } from '@/datasource';

export abstract class NewClientScopeValidator implements NewClientScopeInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract scope: string;
}

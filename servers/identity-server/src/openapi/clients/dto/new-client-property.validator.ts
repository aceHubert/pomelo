import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { NewClientPropertyInput } from '@/datasource';

export abstract class NewClientPropertyValidator implements NewClientPropertyInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract key: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract value: string;
}

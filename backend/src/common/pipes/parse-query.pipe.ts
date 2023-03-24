import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ClassConstructor, plainToClass } from 'class-transformer';

// Types
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseQueryPipe implements PipeTransform<string> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    const obj = plainToClass(metatype as ClassConstructor<any>, value);
    return obj;
  }
}

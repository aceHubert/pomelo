import { Injectable, ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToClass } from 'class-transformer';

@Injectable()
export class ParseQueryPipe implements PipeTransform<string> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    const obj = plainToClass(metatype as ClassConstructor<any>, value);
    return obj;
  }
}

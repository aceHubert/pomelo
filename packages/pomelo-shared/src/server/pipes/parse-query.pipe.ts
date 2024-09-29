import { Injectable, Optional, ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance, ClassTransformOptions } from 'class-transformer';

@Injectable()
export class ParseQueryPipe implements PipeTransform<any> {
  constructor(@Optional() protected readonly options?: ClassTransformOptions) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    const obj = plainToInstance(metatype as ClassConstructor<any>, value, this.options);
    return obj;
  }
}

import { Module } from '@nestjs/common';
import { TermTaxonomyController } from './term-taxonomy.controller';
import { TermTaxonomyResolver } from './term-taxonomy.resolver';

@Module({
  controllers: [TermTaxonomyController],
  providers: [TermTaxonomyResolver],
})
export class TermTaxonomyModule {}

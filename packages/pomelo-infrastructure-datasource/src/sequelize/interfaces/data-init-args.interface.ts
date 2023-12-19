import { CreationAttributes } from 'sequelize';
import { default as Options } from '../entities/options.entity';
import { default as TermTaxonomy } from '../entities/term-taxonomy.entity';
import { default as TermTaxonomyMeta } from '../entities/term-taxonomy-meta.entity';
import { default as Templates } from '../entities/templates.entity';
import { default as TemplateMeta } from '../entities/template-meta.entity';
import { default as Users } from '../entities/users.entity';
import { default as UserMeta } from '../entities/user-meta.entity';

export interface DataInitArgs {
  users?: Array<
    CreationAttributes<Users> & {
      metas?: Array<
        Omit<CreationAttributes<UserMeta>, 'userId'> & {
          keyWithTablePrefix?: true;
        }
      >;
    }
  >;
  options?: Array<
    CreationAttributes<Options> & {
      nameWithTablePrefix?: true;
    }
  >;
  taxonomies?: Array<
    CreationAttributes<TermTaxonomy> & {
      metas?: Array<Omit<CreationAttributes<TermTaxonomyMeta>, 'termTaxonomyId'>>;
      // 将 id 作为 optionValue 保存到 Options 表中
      optionName?: string;
      optionNameWithTablePrefix?: true;
    }
  >;
  templates?: Array<
    Omit<CreationAttributes<Templates>, 'author'> & {
      metas?: Array<Omit<CreationAttributes<TemplateMeta>, 'templateId'>>;
      // 将 id 作为 optionValue 保存到 Options 表中
      optionName?: string;
      optionNameWithTablePrefix?: true;
    }
  >;
}

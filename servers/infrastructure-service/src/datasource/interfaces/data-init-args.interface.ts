import { CreationAttributes } from 'sequelize';
import {
  Options,
  TermTaxonomy,
  TermTaxonomyMeta,
  Templates,
  TemplateMeta,
  Users,
  UserMeta,
} from '../sequelize/entities';

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

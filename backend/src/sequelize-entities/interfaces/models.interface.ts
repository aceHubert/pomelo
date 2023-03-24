import { ModelStatic } from 'sequelize';
import Opitons from '@/sequelize-entities/entities/options.entity';
import Template from '../entities/template.entity';
import TemplateMeta from '../entities/template-meta.entity';
import Comments from '@/sequelize-entities/entities/comments.entity';
import CommentMeta from '@/sequelize-entities/entities/comment-meta.entity';
import Medias from '@/sequelize-entities/entities/medias.entity';
import MediaMeta from '@/sequelize-entities/entities/media-meta.entity';
import Links from '@/sequelize-entities/entities/links.entity';
import TermTaxonomy from '../entities/term-taxonomy.entity';
import TermTaxonomyMeta from '../entities/term-taxonomy-meta.entity';
import TermRelationships from '../entities/term-relationships.entity';

export type Models = {
  Options: ModelStatic<Opitons>;
  Template: ModelStatic<Template>;
  TemplateMeta: ModelStatic<TemplateMeta>;
  Comments: ModelStatic<Comments>;
  CommentMeta: ModelStatic<CommentMeta>;
  Medias: ModelStatic<Medias>;
  MediaMeta: ModelStatic<MediaMeta>;
  Links: ModelStatic<Links>;
  TermTaxonomy: ModelStatic<TermTaxonomy>;
  TermTaxonomyMeta: ModelStatic<TermTaxonomyMeta>;
  TermRelationships: ModelStatic<TermRelationships>;
};

import { ModelStatic } from 'sequelize';
import Comments from '../entities/comments.entity';
import CommentMeta from '../entities/comment-meta.entity';
import Medias from '../entities/medias.entity';
import MediaMeta from '../entities/media-meta.entity';
import Links from '../entities/links.entity';
import TemplateMeta from '../entities/template-meta.entity';
import Templates from '../entities/templates.entity';
import Opitons from '../entities/options.entity';
import TermTaxonomy from '../entities/term-taxonomy.entity';
import TermTaxonomyMeta from '../entities/term-taxonomy-meta.entity';
import TermRelationships from '../entities/term-relationships.entity';
import Users from '../entities/users.entity';
import UserMeta from '../entities/user-meta.entity';

export type Models = {
  Options: ModelStatic<Opitons>;
  Templates: ModelStatic<Templates>;
  TemplateMeta: ModelStatic<TemplateMeta>;
  Comments: ModelStatic<Comments>;
  CommentMeta: ModelStatic<CommentMeta>;
  Medias: ModelStatic<Medias>;
  MediaMeta: ModelStatic<MediaMeta>;
  Links: ModelStatic<Links>;
  TermTaxonomy: ModelStatic<TermTaxonomy>;
  TermTaxonomyMeta: ModelStatic<TermTaxonomyMeta>;
  TermRelationships: ModelStatic<TermRelationships>;
  Users: ModelStatic<Users>;
  UserMeta: ModelStatic<UserMeta>;
};

export interface TableAssociateFunc {
  (models: Models): void;
}

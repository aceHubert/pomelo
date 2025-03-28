import { Controller } from '@nestjs/common';
import { TemplatePresetType } from '@ace-pomelo/shared/server';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import { IdRequest } from '@ace-pomelo/shared/server/proto-ts/common/shared';
import {
  TemplateServiceControllerMethods,
  TemplateServiceController,
  GetTemplateRequest,
  GetTemplateByNameRequest,
  GetTemplateResponse,
  GetTemplateOptionsRequest,
  GetTemplateOptionsResponse,
  GetTemplateNamesRequest,
  GetTemplateNamesResponse,
  GetTemplateCountByDayRequest,
  GetTemplateCountByDayResponse,
  GetTemplateCountByMonthRequest,
  GetTemplateCountByMonthResponse,
  GetTemplateCountByYearRequest,
  GetTemplateCountByYearResponse,
  GetTemplateCountByStatusRequest,
  GetTemplateCountByStatusResponse,
  GetPagedTemplateRequest,
  GetPagedTemplateResponse,
  GetTemplateSelfCountRequest,
  GetTemplateSelfCountResponse,
  GetTemplateRevisionCountResponse,
  GetTemplateRevisionsRquest,
  GetTemplateRevisionsResponse,
  CreateTemplateRequest,
  CreatePresetTypeTemplateRequest,
  CreateTemplateResponse,
  UpdateTemplateRequest,
  UpdateTemplateStatusRequest,
  BulkUpdateTemplateStatusRequest,
  UpdateTemplateNameRequest,
  UpdateCommentCountRequest,
  RestoreTemplateRequest,
  BulkRestoreTemplateRequest,
  DeleteTemplateRequest,
  BulkDeleteTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { WrapperTemplateStatus, WrapperTemplateCommentStatus } from '@/common/utils/wrapper-enum.util';
import { TemplateDataSource } from '../datasource';
import { createMetaController } from './meta.controller';

@Controller()
@TemplateServiceControllerMethods()
export class TemplateController extends createMetaController('template') implements TemplateServiceController {
  constructor(private readonly templateDataSource: TemplateDataSource) {
    super(templateDataSource);
  }

  get({ fields, id, type, requestUserId }: GetTemplateRequest): Promise<GetTemplateResponse> {
    return this.templateDataSource.get(id, type, fields, requestUserId).then((result) => {
      return { template: result };
    });
  }

  getByName({ fields, name, type, requestUserId }: GetTemplateByNameRequest): Promise<GetTemplateResponse> {
    return this.templateDataSource.getByName(name, type, fields, requestUserId).then((result) => {
      return { template: result };
    });
  }

  getOptions({
    fields,
    type,
    keywordField,
    taxonomies,
    ...query
  }: GetTemplateOptionsRequest): Promise<GetTemplateOptionsResponse> {
    if (fields.length === 0) {
      fields = ['id', 'title'];
    }

    if (keywordField && !['title', 'name'].includes(keywordField)) {
      keywordField = 'title';
    }

    return this.templateDataSource
      .getOptions(
        {
          ...query,
          keywordField: keywordField as any, // type error
          taxonomies: taxonomies as any,
        },
        type,
        fields,
      )
      .then((result) => {
        return { options: result };
      });
  }

  getNames({ type }: GetTemplateNamesRequest): Promise<GetTemplateNamesResponse> {
    return this.templateDataSource.getNames(type).then((result) => {
      return { names: result };
    });
  }

  getCountByDay({ type, month }: GetTemplateCountByDayRequest): Promise<GetTemplateCountByDayResponse> {
    return this.templateDataSource.getCountByDay(month, type).then((result) => {
      return { counts: result };
    });
  }

  getCountByMonth({ type, year, months }: GetTemplateCountByMonthRequest): Promise<GetTemplateCountByMonthResponse> {
    return this.templateDataSource.getCountByMonth({ year, months }, type).then((result) => {
      return { counts: result };
    });
  }

  getCountByYear({ type }: GetTemplateCountByYearRequest): Promise<GetTemplateCountByYearResponse> {
    return this.templateDataSource.getCountByYear(type).then((result) => {
      return { counts: result };
    });
  }

  getCountByStatus({
    type,
    requestUserId,
  }: GetTemplateCountByStatusRequest): Promise<GetTemplateCountByStatusResponse> {
    return this.templateDataSource.getCountByStatus(type, requestUserId).then((result) => {
      return { counts: result };
    });
  }

  getPaged({
    fields,
    type,
    keywordField,
    status,
    taxonomies,
    requestUserId,
    ...query
  }: GetPagedTemplateRequest): Promise<GetPagedTemplateResponse> {
    if (keywordField && !['title', 'name'].includes(keywordField)) {
      keywordField = 'title';
    }
    return this.templateDataSource.getPaged(
      {
        ...query,
        status: WrapperTemplateStatus.asValueOrDefault(status, void 0),
        keywordField: keywordField as any, // type error
        taxonomies: taxonomies as any,
      },
      type,
      fields,
      requestUserId,
    );
  }

  getSelfCount({
    type,
    includeTrashStatus,
    requestUserId,
  }: GetTemplateSelfCountRequest): Promise<GetTemplateSelfCountResponse> {
    return this.templateDataSource.getSelfCount(type, includeTrashStatus, requestUserId).then((result) => {
      return { counts: result };
    });
  }

  getRevisionCount({ id }: IdRequest): Promise<GetTemplateRevisionCountResponse> {
    return this.templateDataSource.getRevisionCount(id).then((result) => {
      return { counts: result };
    });
  }

  getRevisions({ fields, id, requestUserId }: GetTemplateRevisionsRquest): Promise<GetTemplateRevisionsResponse> {
    return this.templateDataSource.getRevisions(id, fields, requestUserId).then((result) => {
      return { revisions: result };
    });
  }

  createForm({ requestUserId, ...model }: CreatePresetTypeTemplateRequest): Promise<CreateTemplateResponse> {
    return this.templateDataSource
      .create(
        {
          ...model,
          excerpt: model.excerpt || '',
          status: WrapperTemplateStatus.asValueOrDefault(model.status, void 0),
          commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, void 0),
        },
        TemplatePresetType.Form,
        requestUserId,
      )
      .then((result) => {
        return { template: result };
      });
  }

  createPage({ requestUserId, ...model }: CreatePresetTypeTemplateRequest): Promise<CreateTemplateResponse> {
    return this.templateDataSource
      .create(
        {
          ...model,
          excerpt: model.excerpt || '',
          status: WrapperTemplateStatus.asValueOrDefault(model.status, void 0),
          commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, void 0),
        },
        TemplatePresetType.Page,
        requestUserId,
      )
      .then((result) => {
        return { template: result };
      });
  }

  createPost({ requestUserId, ...model }: CreatePresetTypeTemplateRequest): Promise<CreateTemplateResponse> {
    return this.templateDataSource
      .create(
        {
          ...model,
          excerpt: model.excerpt || '',
          status: WrapperTemplateStatus.asValueOrDefault(model.status, void 0),
          commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, void 0),
        },
        TemplatePresetType.Post,
        requestUserId,
      )
      .then((result) => {
        return { template: result };
      });
  }

  create({ type, requestUserId, ...model }: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    return this.templateDataSource
      .create(
        {
          ...model,
          status: WrapperTemplateStatus.asValueOrDefault(model.status, void 0),
          commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, void 0),
        },
        type,
        requestUserId,
      )
      .then((result) => {
        return { template: result };
      });
  }

  update({ id, requestUserId, ...model }: UpdateTemplateRequest): Promise<Empty> {
    return this.templateDataSource
      .update(
        id,
        {
          ...model,
          status: WrapperTemplateStatus.asValueOrDefault(model.status, void 0),
          commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, void 0),
        },
        requestUserId,
      )
      .then(() => {
        return {};
      });
  }

  updateName({ id, name, requestUserId }: UpdateTemplateNameRequest): Promise<Empty> {
    return this.templateDataSource.updateName(id, name, requestUserId).then(() => {
      return {};
    });
  }

  updateStatus({ id, status, requestUserId }: UpdateTemplateStatusRequest): Promise<Empty> {
    return this.templateDataSource
      .updateStatus(id, WrapperTemplateStatus.asValueOrThrow(status), requestUserId)
      .then(() => {
        return {};
      });
  }

  bulkUpdateStatus({ ids, status, requestUserId }: BulkUpdateTemplateStatusRequest): Promise<Empty> {
    return this.templateDataSource
      .bulkUpdateStatus(ids, WrapperTemplateStatus.asValueOrThrow(status), requestUserId)
      .then(() => {
        return {};
      });
  }

  updateCommentCount({ id, count }: UpdateCommentCountRequest): Promise<Empty> {
    return this.templateDataSource.updateCommentCount(id, count).then(() => {
      return {};
    });
  }

  restore({ id, requestUserId }: RestoreTemplateRequest): Promise<Empty> {
    return this.templateDataSource.restore(id, requestUserId).then(() => {
      return {};
    });
  }

  bulkRestore({ ids, requestUserId }: BulkRestoreTemplateRequest): Promise<Empty> {
    return this.templateDataSource.bulkRestore(ids, requestUserId).then(() => {
      return {};
    });
  }

  delete({ id, requestUserId }: DeleteTemplateRequest): Promise<Empty> {
    return this.templateDataSource.delete(id, requestUserId).then(() => {
      return {};
    });
  }

  bulkDelete({ ids, requestUserId }: BulkDeleteTemplateRequest): Promise<Empty> {
    return this.templateDataSource.bulkDelete(ids, requestUserId).then(() => {
      return {};
    });
  }
}

import { Controller } from '@nestjs/common';
import { LinkTarget } from '@ace-pomelo/shared/server';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import {
  LinkServiceControllerMethods,
  LinkServiceController,
  GetLinkRequest,
  GetLinkResponse,
  GetPagedLinkRequest,
  GetPagedLinkResponse,
  CreateLinkRequest,
  CreateLinkResponse,
  UpdateLinkRequest,
  DeleteLinkRequest,
} from '@ace-pomelo/shared/server/proto-ts/link';
import { WrapperLinkVisible, WrapperLinkTarget } from '@/common/utils/wrapper-enum.util';
import { LinkDataSource } from '../datasource';

@Controller()
@LinkServiceControllerMethods()
export class LinkController implements LinkServiceController {
  constructor(private readonly linkDataSource: LinkDataSource) {}

  get({ fields, id }: GetLinkRequest): Promise<GetLinkResponse> {
    return this.linkDataSource.get(id, fields).then((result) => {
      return { link: result };
    });
  }

  getPaged({ fields, ...query }: GetPagedLinkRequest): Promise<GetPagedLinkResponse> {
    return this.linkDataSource.getPaged(query, fields);
  }

  create({ requestUserId, ...model }: CreateLinkRequest): Promise<CreateLinkResponse> {
    return this.linkDataSource
      .create(
        {
          ...model,
          visible: WrapperLinkVisible.asValueOrDefault(model.visible, void 0),
          target: WrapperLinkTarget.asValueOrDefault(model.target, LinkTarget.Blank),
        },
        requestUserId,
      )
      .then((result) => {
        return { link: result };
      });
  }

  update({ id, requestUserId, ...model }: UpdateLinkRequest): Promise<Empty> {
    return this.linkDataSource
      .update(
        id,
        {
          ...model,
          visible: WrapperLinkVisible.asValueOrDefault(model.visible, void 0),
          target: WrapperLinkTarget.asValueOrDefault(model.target, void 0),
        },
        requestUserId,
      )
      .then(() => {
        return {};
      });
  }

  async delete({ id, requestUserId }: DeleteLinkRequest): Promise<Empty> {
    return this.linkDataSource.delete(id, requestUserId).then(() => {
      return {};
    });
  }
}

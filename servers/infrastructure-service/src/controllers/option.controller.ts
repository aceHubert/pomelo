import { Controller } from '@nestjs/common';
import { BoolValue } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/wrappers';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import {
  OptionServiceControllerMethods,
  OptionServiceController,
  GetOptionRequest,
  GetOptionResponse,
  GetAutoloadOptionsResponse,
  GetOptionValueRequest,
  GetOptionValueResponse,
  GetOptionsRequest,
  GetOptionsResponse,
  IsExistRequest,
  CreateOptionRequest,
  CreateOptionResponse,
  UpdateOptionRequest,
  DeleteOptionRequest,
  GetOptionByNameRequest,
} from '@ace-pomelo/shared/server/proto-ts/option';
import { WrapperOptionAutoload } from '@/common/utils/wrapper-enum.util';
import { OptionDataSource } from '../datasource';

@Controller()
@OptionServiceControllerMethods()
export class OptionController implements OptionServiceController {
  constructor(private readonly optionDataSource: OptionDataSource) {}

  get({ fields, id }: GetOptionRequest): Promise<GetOptionResponse> {
    return this.optionDataSource.get(id, fields).then((result) => {
      return { option: result };
    });
  }

  getByName({ optionName, fields }: GetOptionByNameRequest): Promise<GetOptionResponse> {
    return this.optionDataSource.getByName(optionName, fields).then((result) => {
      return { option: result };
    });
  }

  getAutoloads(): Promise<GetAutoloadOptionsResponse> {
    return this.optionDataSource.getAutoloads().then((result) => {
      return { options: result };
    });
  }

  getValue({ optionName }: GetOptionValueRequest): Promise<GetOptionValueResponse> {
    return this.optionDataSource.getValue(optionName).then((result) => {
      return { optionValue: result };
    });
  }

  getList({ fields, optionNames, autoload }: GetOptionsRequest): Promise<GetOptionsResponse> {
    return this.optionDataSource
      .getList(
        {
          autoload: WrapperOptionAutoload.asValueOrDefault(autoload, void 0),
          optionNames: optionNames?.value,
        },
        fields,
      )
      .then((result) => {
        return { options: result };
      });
  }

  isExists({ optionName }: IsExistRequest): Promise<BoolValue> {
    // always return true if optionName is not provided
    if (!optionName) return Promise.resolve({ value: true });

    return this.optionDataSource.isExists(optionName).then((result) => {
      return { value: result };
    });
  }

  create({ requestUserId, ...model }: CreateOptionRequest): Promise<CreateOptionResponse> {
    return this.optionDataSource
      .create({ ...model, autoload: WrapperOptionAutoload.asValueOrDefault(model.autoload, void 0) }, requestUserId)
      .then((result) => {
        return { option: result };
      });
  }

  update({ id, requestUserId, ...model }: UpdateOptionRequest): Promise<Empty> {
    return this.optionDataSource.update(id, model, requestUserId).then(() => {
      return {};
    });
  }

  reset(): Promise<Empty> {
    this.optionDataSource.reset();
    return Promise.resolve({});
  }

  delete({ id, requestUserId }: DeleteOptionRequest): Promise<Empty> {
    return this.optionDataSource.delete(id, requestUserId).then(() => {
      return {};
    });
  }
}

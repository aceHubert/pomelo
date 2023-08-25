import { OptionAttributes, OptionCreationAttributes, OptionAutoload } from '../../entities/options.entity';

export interface OptionModel extends OptionAttributes {}

export interface OptionArgs {
  autoload?: OptionAutoload;
}

export interface NewOptionInput extends Pick<OptionCreationAttributes, 'optionName' | 'optionValue' | 'autoload'> {}

export class UpdateOptionInput {
  optionValue?: string;
  autoload?: OptionAutoload;
}

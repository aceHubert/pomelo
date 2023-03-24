import { Models } from './models.interface';

export interface TableAssociateFunc {
  (models: Models): void;
}

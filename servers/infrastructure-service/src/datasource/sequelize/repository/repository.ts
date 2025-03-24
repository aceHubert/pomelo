import { NonAbstract } from '../../entities/types';
import { Model } from '..';

export type Repository<M> = (new () => M) & NonAbstract<typeof Model>;

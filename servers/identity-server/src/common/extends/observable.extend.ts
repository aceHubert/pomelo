import { Observable, firstValueFrom, lastValueFrom } from 'rxjs';

declare module 'rxjs' {
  interface Observable<T> {
    firstValue<D>(defaultValue: D): Promise<T | D>;
    firstValue(): Promise<T>;
    lastValue<D>(defaultValue: D): Promise<T | D>;
    lastValue(): Promise<T>;
  }
}
/**
 * ClientProxy send undefined value return EmptyError in firstValueFrom and  lastValueFrom,
 * Set default value to avoid EmptyError
 */
Object.defineProperties(Observable.prototype, {
  firstValue: {
    value: function <T, D>(this: Observable<T>, defaultValue: D) {
      return firstValueFrom<T, D>(this, { defaultValue });
    },
    writable: false,
    configurable: false,
  },
  lastValue: {
    value: function <T, D>(this: Observable<T>, defaultValue: D) {
      return lastValueFrom<T, D>(this, { defaultValue });
    },
    writable: false,
    configurable: false,
  },
});

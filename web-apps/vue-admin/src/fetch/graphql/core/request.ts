import { ApolloError } from '@apollo/client/core';
import { DocumentType, parser } from './parser';

// Types
import type { DocumentNode } from 'graphql';
import type {
  ApolloClient,
  OperationVariables,
  TypedDocumentNode,
  QueryOptions,
  MutationOptions,
  SubscriptionOptions,
  DefaultContext,
} from '@apollo/client/core';

export interface TypedQueryDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistApi type set correctly
   */
  __documentType: DocumentType.Query;
}

export interface TypedMutationDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistApi type set correctly
   */
  __documentType: DocumentType.Mutation;
}

export interface TypedSubscriptionDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistApi type set correctly
   */
  __documentType: DocumentType.Subscription;
}

export type LoadingProp = (text?: string) => void | (() => void);

export interface Options {
  loading: LoadingProp;
  loadingDelay: number;
  onCatch: (err: Error) => void;
}

export interface RequestOptions<TData, Result = TData> {
  loading?: boolean | LoadingProp;
  loadingText?: string;
  catchError?: boolean;
  onSuccess?: (data: TData | null | undefined) => Result | null | undefined;
  onError?: (err: unknown) => void;
}

export interface ObserverOptions<TData> {
  onData: (data?: TData | null) => void;
  onError?: (err: any) => void;
  onComplete?: () => void;
}

export type RegistApiDefinition = Record<
  string,
  DocumentNode | TypedQueryDocumentNode | TypedMutationDocumentNode | TypedSubscriptionDocumentNode
>;

export type RegistApi<C extends RegistApiDefinition> = {
  [P in keyof C]: C[P] extends TypedQueryDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, Result = TData>(
        options?: Omit<QueryOptions<TVariables, TData>, 'query' | 'variables'> &
          RequestOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedMutationDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, TContext = DefaultContext, Result = TData>(
        options?: Omit<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables'> &
          RequestOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedSubscriptionDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType>(
        options?: Omit<SubscriptionOptions<TVariables, TData>, 'query' | 'variables'> &
          ObserverOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => () => void
    : (options?: RequestOptions<any> & { variables?: any }) => Promise<any>;
};

export class Request {
  private defaultOptions: Options;

  constructor(private readonly client: ApolloClient<any>, options: Partial<Options> = {}) {
    const { loading = () => () => {}, loadingDelay = 300, onCatch = () => {} } = options;
    this.defaultOptions = {
      loading,
      loadingDelay,
      onCatch,
    };
  }

  regist<C extends RegistApiDefinition>(apis: C): RegistApi<C> {
    return Object.keys(apis).reduce((prev, key) => {
      const doc = parser(apis[key]);
      if (doc.type === DocumentType.Query) {
        prev[key] = (options: any) => this.sentQuery({ ...options, query: apis[key] });
      } else if (doc.type === DocumentType.Mutation) {
        prev[key] = (options: any) => this.sentMutate({ ...options, mutation: apis[key] });
      } else if (doc.type === DocumentType.Subscription) {
        prev[key] = (options: any) => this.sentSubscribe({ ...options, query: apis[key] });
      } else {
        // TODO
        prev[key] = () => Promise.resolve();
      }
      return prev;
    }, {} as Dictionary<any>) as RegistApi<C>;
  }

  sentQuery<TData = any, TVariables = OperationVariables, Result = TData>({
    loading = false,
    catchError = false,
    onSuccess,
    onError,
    ...queryOptions
  }: RequestOptions<TData, Result> & QueryOptions<TVariables, TData>): Promise<Result> {
    const { loadingDelay, onCatch } = this.defaultOptions;

    const requestPromise = this.client.query(queryOptions);

    let stopLoading: (() => void) | void;
    if (loading) {
      const delaySymbol = Symbol.for(`DELAY_${loadingDelay}`);
      const showLoadingPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(delaySymbol);
        }, loadingDelay);
      });

      Promise.race([showLoadingPromise, requestPromise]).then((delay) => {
        delay === delaySymbol && (stopLoading = this.startLoading(loading));
      });
    }

    // 返回 promise
    return requestPromise
      .then(function ({ data, error }) {
        if (error) throw error;

        stopLoading && stopLoading();
        return onSuccess ? onSuccess(data) : data;
      })
      .catch((err) => {
        stopLoading && stopLoading();
        if (catchError) {
          onCatch && onCatch(err);
          return new Promise(function () {}) as any;
        } else {
          onError && onError(err);
        }
        return Promise.reject(err);
      });
  }

  sentMutate<TData = any, TVariables = OperationVariables, TContext = DefaultContext, Result = TData>({
    loading = false,
    catchError = false,
    onSuccess,
    onError,
    ...mutationOptions
  }: RequestOptions<TData, Result> & MutationOptions<TData, TVariables, TContext>): Promise<Result> {
    const { loadingDelay, onCatch } = this.defaultOptions;

    const requestPromise = this.client.mutate(mutationOptions);

    let stopLoading: (() => void) | void;
    if (loading) {
      const delaySymbol = `DELAY_${loadingDelay}`;
      const showLoadingPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(delaySymbol);
        }, loadingDelay);
      });

      Promise.race([showLoadingPromise, requestPromise]).then((delay) => {
        delay === delaySymbol && (stopLoading = this.startLoading(loading));
      });
    }

    // 返回 promise
    return requestPromise
      .then(function ({ data, errors }) {
        if (errors?.length) throw new ApolloError({ graphQLErrors: errors });

        stopLoading && stopLoading();
        return onSuccess ? onSuccess(data) : data;
      })
      .catch((err) => {
        stopLoading && stopLoading();
        if (catchError) {
          onCatch && onCatch(err);
          return new Promise(function () {}) as any;
        } else {
          onError && onError(err);
        }
        return Promise.reject(err);
      });
  }

  sentSubscribe<TData = any, TVariables = OperationVariables>({
    onData,
    onError,
    onComplete,
    ...subscribeOptions
  }: ObserverOptions<TData> & SubscriptionOptions<TVariables, TData>): () => void {
    const observer = this.client.subscribe(subscribeOptions);

    const subscription = observer.subscribe({
      next: ({ data }) => onData(data),
      error: onError,
      complete: onComplete,
    });

    return () => subscription.unsubscribe();
  }

  private startLoading(loading: boolean | LoadingProp): (() => void) | void {
    if (typeof loading === 'function') {
      return loading();
    } else if (typeof loading === 'boolean' && loading === true) {
      return this.defaultOptions.loading();
    }
    return;
  }
}

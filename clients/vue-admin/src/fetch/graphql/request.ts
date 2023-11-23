import { hasIn, snakeCase } from 'lodash-es';
import { ApolloError, isApolloError } from '@apollo/client/core';
import { DocumentType, parser } from './parser';
import codes from './codes.json';

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
  ServerError,
  ServerParseError,
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
  onCatch: (err: unknown) => void;
  /**
   * graphql error code 对应 http code 关系
   */
  graphqlErrorCodes: Dictionary<number>;
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
  onError?: (err: unknown) => void;
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

/**
 * 是否是 Server error
 * 如果是 ApolloError，则会判断err.networkError
 */
export function isServerError(err: Error): err is ServerError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'result')
    : hasIn(err, 'statusCode') && hasIn(err, 'result');
}

/**
 * 是否是 Server parse error
 */
export function isServerParseError(err: Error): err is ServerParseError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'bodyText')
    : hasIn(err, 'statusCode') && hasIn(err, 'bodyText');
}

export class GraphQLError extends Error {
  readonly code: number;
  readonly originalError?: unknown;

  constructor(message: string, code: number, originalError?: unknown) {
    super(message);
    Object.setPrototypeOf(this, GraphQLError.prototype);
    this.name = 'GraphQLError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class Request {
  private options: Options;

  constructor(private readonly client: ApolloClient<any>, options: Partial<Options> = {}) {
    const { loading = () => () => {}, loadingDelay = 300, onCatch = () => {}, graphqlErrorCodes } = options;

    this.options = {
      loading,
      loadingDelay,
      onCatch,
      graphqlErrorCodes:
        graphqlErrorCodes ??
        Object.keys(codes).reduce((prev, key) => {
          prev[snakeCase(codes[key]).toUpperCase()] = Number(key);
          return prev;
        }, {} as Dictionary<number>),
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

  sentQuery<TData = any, TVariables extends OperationVariables = OperationVariables, Result = TData>({
    loading = false,
    catchError = false,
    onSuccess,
    onError,
    ...queryOptions
  }: RequestOptions<TData, Result> & QueryOptions<TVariables, TData>): Promise<Result> {
    const { loadingDelay, onCatch } = this.options;

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
      .then(({ data, error }) => {
        if (error) throw error;

        stopLoading && stopLoading();
        return onSuccess?.(data) ?? data;
      })
      .catch((err) => {
        stopLoading?.();
        const error = this.formatError(err);
        if (catchError) {
          onCatch(error);
          return new Promise(function () {}) as any;
        } else {
          onError?.(error);
        }
        throw error;
      });
  }

  sentMutate<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, any> = DefaultContext,
    Result = TData,
  >({
    loading = false,
    catchError = false,
    onSuccess,
    onError,
    ...mutationOptions
  }: RequestOptions<TData, Result> & MutationOptions<TData, TVariables, TContext>): Promise<Result> {
    const { loadingDelay, onCatch } = this.options;

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
      .then(({ data, errors }) => {
        if (errors?.length) throw new ApolloError({ graphQLErrors: errors });

        stopLoading?.();
        return onSuccess?.(data) ?? data;
      })
      .catch((err) => {
        stopLoading?.();
        const error = this.formatError(err);
        if (catchError) {
          onCatch(error);
          return new Promise(function () {}) as any;
        } else {
          onError?.(error);
        }

        throw error;
      });
  }

  sentSubscribe<TData = any, TVariables extends OperationVariables = OperationVariables>({
    onData,
    onError,
    onComplete,
    ...subscribeOptions
  }: ObserverOptions<TData> & SubscriptionOptions<TVariables, TData>): () => void {
    const observer = this.client.subscribe(subscribeOptions);

    const subscription = observer.subscribe({
      next: ({ data }) => onData(data),
      error: (err) => onError?.(this.formatError(err)),
      complete: onComplete,
    });

    return () => subscription.unsubscribe();
  }

  private startLoading(loading: boolean | LoadingProp): (() => void) | void {
    if (typeof loading === 'function') {
      return loading();
    } else if (typeof loading === 'boolean' && loading === true) {
      return this.options.loading();
    }
    return;
  }

  /**
   * 从error 中生成 code 和 message
   * code 在 networkError 中将会是 error.[statusCode], graphQLErrors 中将会是第一条 error.[extensions.code], fallbace: code.500
   * @param err Error
   */
  private formatError(err: Error) {
    if (isApolloError(err)) {
      let graphQLErrors = err.graphQLErrors;
      const networkError = err.networkError;
      // https://www.apollographql.com/docs/react/api/link/apollo-link-error/#:~:text=An%20error%20is%20passed%20as%20a%20networkError%20if,the%20case%20of%20a%20failing%20HTTP%20status%20code.
      if (
        !graphQLErrors?.length &&
        networkError &&
        isServerError(networkError) &&
        typeof networkError.result !== 'string' &&
        networkError.result.errors
      ) {
        graphQLErrors = networkError.result.errors;
      }

      if (Array.isArray(graphQLErrors) && graphQLErrors.length) {
        // 第一要包含code的详细信息
        const extensions = graphQLErrors.find((error) => error.extensions?.code)?.extensions;
        return new GraphQLError(
          graphQLErrors.length === 1
            ? graphQLErrors[0].message || err.message
            : `Errors: ${graphQLErrors
                .map((graphQLError) => graphQLError?.message)
                .filter(Boolean)
                .join('; ')}`,
          extensions ? extensions.statusCode || this.options.graphqlErrorCodes[extensions.code] || 500 : 500,
          err,
        );
      } else if (networkError && isServerError(networkError)) {
        return new GraphQLError(networkError.message, networkError.statusCode, err);
      }
    }
    return new GraphQLError(err.message, 500, err);
  }
}

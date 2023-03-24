export class ObsCommonError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ObsCommonError';
  }
}

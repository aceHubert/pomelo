export interface PagedSubModuleArgs {
  name?: string;
  offset?: number;
  limit?: number;
}

export interface PagedObsSubModuleArgs extends Omit<PagedSubModuleArgs, 'offset'> {
  marker?: string;
}

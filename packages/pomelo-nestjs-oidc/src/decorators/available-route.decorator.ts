import { SetMetadata } from '@nestjs/common';

export const IsAvailableRouteForMultitenant = (isMultitenant: boolean) => SetMetadata('isMultitenant', isMultitenant);

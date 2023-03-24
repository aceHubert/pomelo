import { GraphQLScalarType, Kind } from 'graphql';
import moment from 'moment';

export const GraphQLMomentISODateTime = new GraphQLScalarType({
  name: 'MomentDatetime',
  description: 'A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the moment format.',
  parseValue(value: any) {
    return moment(value).toDate();
  },
  serialize(value: any) {
    const d = moment(value);
    return d.isValid() ? d.toISOString() : null;
  },
  parseLiteral(ast) {
    return ast.kind === Kind.STRING || ast.kind === Kind.INT ? moment(ast.value).toDate() : null;
  },
});

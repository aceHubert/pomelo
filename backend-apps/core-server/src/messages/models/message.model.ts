import { isObject } from 'class-validator';
import { Field, Int, ObjectType, createUnionType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class EventMessageSubscriotion {
  @Field({ description: 'Event name' })
  eventName!: string;
}

@ObjectType()
export class StringPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  @Field({ nullable: true, description: 'String payload' })
  payload?: string;
}

@ObjectType()
export class IntPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  @Field(() => Int, { nullable: true, description: 'Number payload' })
  payload?: number;
}

@ObjectType()
export class BooleanPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  @Field({ nullable: true, description: 'Boolean payload' })
  payload?: boolean;
}

@ObjectType()
export class ObjectPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  @Field(() => GraphQLJSONObject, { nullable: true, description: 'Object payload' })
  payload?: Record<string, any>;
}

@ObjectType()
export class ContentMessageSubscriotion {
  @Field({ description: 'Message content' })
  content!: string;

  @Field({ nullable: true, description: 'URL' })
  to?: string;
}

export const MessageSubscriotion = createUnionType({
  name: 'MessageSubscriotion',
  description: 'Message subscription union type',
  types: () => [
    EventMessageSubscriotion,
    StringPayloadEventMessageSubscriotion,
    IntPayloadEventMessageSubscriotion,
    BooleanPayloadEventMessageSubscriotion,
    ObjectPayloadEventMessageSubscriotion,
    ContentMessageSubscriotion,
  ],
  resolveType(value) {
    if ('eventName' in value) {
      if (isObject(value.payload)) {
        return ObjectPayloadEventMessageSubscriotion;
      } else if (typeof value.payload === 'string') {
        return StringPayloadEventMessageSubscriotion;
      } else if (typeof value.payload === 'number') {
        return IntPayloadEventMessageSubscriotion;
      } else if (typeof value.payload === 'boolean') {
        return BooleanPayloadEventMessageSubscriotion;
      } else {
        return EventMessageSubscriotion;
      }
    }

    if ('content' in value) {
      return ContentMessageSubscriotion;
    }

    return null;
  },
});

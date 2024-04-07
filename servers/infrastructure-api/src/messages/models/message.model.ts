import { isObject } from 'class-validator';
import { Field, Int, ObjectType, createUnionType } from '@nestjs/graphql';
import { JSONObjectResolver } from 'graphql-scalars';

@ObjectType()
export class EventMessageSubscriotion {
  /**
   * Event name
   */
  eventName!: string;
}

@ObjectType()
export class StringPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  /**
   * String payload
   */
  payload?: string;
}

@ObjectType()
export class NumberPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  /**
   * Number payload
   */
  @Field(() => Int)
  payload?: number;
}

@ObjectType()
export class BooleanPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  /**
   * Boolean payload
   */
  payload?: boolean;
}

@ObjectType()
export class ObjectPayloadEventMessageSubscriotion extends EventMessageSubscriotion {
  /**
   * Object payload
   */
  @Field(() => JSONObjectResolver)
  payload?: Record<string, any>;
}

@ObjectType()
export class ContentMessageSubscriotion {
  /**
   * Message content
   */
  content!: string;

  /**
   * URL
   */
  to?: string;
}

export const MessageSubscriotion = createUnionType({
  name: 'MessageSubscriotion',
  description: 'Message subscription union type',
  types: () => [
    EventMessageSubscriotion,
    StringPayloadEventMessageSubscriotion,
    NumberPayloadEventMessageSubscriotion,
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
        return NumberPayloadEventMessageSubscriotion;
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

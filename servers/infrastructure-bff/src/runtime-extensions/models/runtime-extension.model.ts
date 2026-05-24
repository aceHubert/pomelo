import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Runtime extension failure' })
export class RuntimeExtensionFailureModel {
  @Field(() => String)
  id!: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String)
  phase!: string;

  @Field(() => String)
  reason!: string;

  @Field(() => String, { nullable: true })
  directoryPath?: string;

  @Field(() => String, { nullable: true })
  entryPath?: string;
}

@ObjectType({ description: 'Runtime extension state item' })
export class RuntimeExtensionStateItemModel {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  type!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  version?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean)
  installed!: boolean;

  @Field(() => Boolean)
  configured!: boolean;

  @Field(() => Boolean)
  loaded!: boolean;

  @Field(() => Boolean)
  uninstallPending!: boolean;

  @Field(() => Boolean)
  activeTheme!: boolean;

  @Field(() => Boolean)
  hasServerModule!: boolean;

  @Field(() => String, { nullable: true })
  directoryPath?: string;

  @Field(() => String, { nullable: true })
  failedReason?: string;
}

@ObjectType({ description: 'System heartbeat' })
export class SystemHeartbeatModel {
  @Field(() => String)
  bootId!: string;

  @Field(() => String)
  startedAt!: string;

  @Field(() => Boolean)
  ready!: boolean;

  @Field(() => String)
  activePluginsHash!: string;

  @Field(() => [String])
  loadedPlugins!: string[];

  @Field(() => [RuntimeExtensionFailureModel])
  failedPlugins!: RuntimeExtensionFailureModel[];
}

@ObjectType({ description: 'Runtime extension state' })
export class RuntimeExtensionStateModel extends SystemHeartbeatModel {
  @Field(() => String)
  contentPath!: string;

  @Field(() => [String])
  activePlugins!: string[];

  @Field(() => [String])
  uninstallPlugins!: string[];

  @Field(() => String, { nullable: true })
  template?: string;

  @Field(() => String, { nullable: true })
  stylesheet?: string;

  @Field(() => [RuntimeExtensionStateItemModel])
  plugins!: RuntimeExtensionStateItemModel[];

  @Field(() => [RuntimeExtensionStateItemModel])
  themes!: RuntimeExtensionStateItemModel[];

  @Field(() => String, { nullable: true })
  optionsReadError?: string;
}

@ObjectType({ description: 'Update runtime plugins payload' })
export class UpdateRuntimePluginsPayloadModel {
  @Field(() => Boolean)
  restartRequired!: boolean;

  @Field(() => RuntimeExtensionStateModel)
  state!: RuntimeExtensionStateModel;
}

@ObjectType({ description: 'Restart runtime payload' })
export class RestartRuntimePayloadModel {
  @Field(() => Boolean)
  accepted!: boolean;

  @Field(() => String)
  bootId!: string;

  @Field(() => String)
  scheduledAt!: string;

  @Field(() => Int)
  delayMs!: number;
}

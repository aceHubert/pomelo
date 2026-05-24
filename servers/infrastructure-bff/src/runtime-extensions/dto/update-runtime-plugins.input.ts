import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Update runtime plugins input' })
export class UpdateRuntimePluginsInput {
  @Field(() => [String], { nullable: true, description: 'Active plugin ids' })
  activePlugins?: string[];

  @Field(() => [String], { nullable: true, description: 'Uninstall-pending plugin ids' })
  uninstallPlugins?: string[];
}

@InputType({ description: 'Restart runtime input' })
export class RestartRuntimeInput {
  @Field(() => Int, { nullable: true, description: 'Delay before SIGTERM in milliseconds' })
  delayMs?: number;
}

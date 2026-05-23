import { RAM_AUTHORIZATION_ACTION_KEY } from '@ace-nestjs/ram-authorization';
import { RuntimeExtensionAction } from '@/common/actions';
import { RuntimeExtensionController } from './runtime-extension.controller';

describe('RuntimeExtensionController', () => {
  const runtimeExtensionService = {
    getHeartbeat: jest.fn(() => ({
      bootId: 'boot-1',
      startedAt: '2026-05-23T00:00:00.000Z',
      ready: true,
      activePluginsHash: 'hash-1',
      loadedPlugins: [],
      failedPlugins: [],
    })),
    getState: jest.fn(),
    updatePlugins: jest.fn(),
    restart: jest.fn(() => ({
      accepted: true,
      bootId: 'boot-1',
      scheduledAt: '2026-05-23T00:00:01.000Z',
      delayMs: 50,
    })),
  };

  it('returns heartbeat payload', () => {
    const controller = new RuntimeExtensionController(runtimeExtensionService as any);

    expect(controller.heartbeat()).toEqual({
      success: true,
      data: expect.objectContaining({
        bootId: 'boot-1',
        ready: true,
      }),
    });
  });

  it('returns restart acknowledgement before deferred exit', () => {
    const controller = new RuntimeExtensionController(runtimeExtensionService as any);

    expect(controller.restart({ delayMs: 50 })).toEqual({
      success: true,
      data: expect.objectContaining({
        accepted: true,
        delayMs: 50,
      }),
    });
  });

  it('declares RAM actions for protected management methods', () => {
    expect(Reflect.getMetadata(RAM_AUTHORIZATION_ACTION_KEY, RuntimeExtensionController.prototype.getState)).toBe(
      RuntimeExtensionAction.List,
    );
    expect(Reflect.getMetadata(RAM_AUTHORIZATION_ACTION_KEY, RuntimeExtensionController.prototype.updatePlugins)).toBe(
      RuntimeExtensionAction.Update,
    );
    expect(Reflect.getMetadata(RAM_AUTHORIZATION_ACTION_KEY, RuntimeExtensionController.prototype.restart)).toBe(
      RuntimeExtensionAction.Restart,
    );
  });
});

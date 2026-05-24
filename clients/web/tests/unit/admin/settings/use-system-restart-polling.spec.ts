import { waitForSystemRestart } from '@/admin/views/settings/composables/use-system-restart-polling';

describe('waitForSystemRestart', () => {
  it('resolves when heartbeat returns a new ready boot id', async () => {
    const heartbeats = [
      { bootId: 'old', startedAt: '', ready: true, activePluginsHash: 'a', loadedPlugins: [], failedPlugins: [] },
      { bootId: 'new', startedAt: '', ready: true, activePluginsHash: 'b', loadedPlugins: [], failedPlugins: [] },
    ];

    await expect(
      waitForSystemRestart({
        beforeBootId: 'old',
        getHeartbeat: jest.fn(() => Promise.resolve(heartbeats.shift()!)),
        initialDelayMs: 0,
        intervalMs: 0,
        timeoutMs: 1000,
        sleep: () => Promise.resolve(),
      }),
    ).resolves.toMatchObject({ bootId: 'new' });
  });

  it('keeps polling through network errors', async () => {
    const getHeartbeat = jest.fn().mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce({
      bootId: 'new',
      startedAt: '',
      ready: true,
      activePluginsHash: 'b',
      loadedPlugins: [],
      failedPlugins: [],
    });

    await expect(
      waitForSystemRestart({
        beforeBootId: 'old',
        getHeartbeat,
        initialDelayMs: 0,
        intervalMs: 0,
        timeoutMs: 1000,
        sleep: () => Promise.resolve(),
      }),
    ).resolves.toMatchObject({ bootId: 'new' });
  });

  it('rejects after timeout', async () => {
    let now = 0;

    await expect(
      waitForSystemRestart({
        beforeBootId: 'old',
        getHeartbeat: jest.fn(() =>
          Promise.resolve({
            bootId: 'old',
            startedAt: '',
            ready: true,
            activePluginsHash: 'a',
            loadedPlugins: [],
            failedPlugins: [],
          }),
        ),
        initialDelayMs: 0,
        intervalMs: 10,
        timeoutMs: 20,
        sleep: async (ms) => {
          now += ms;
        },
        now: () => now,
      }),
    ).rejects.toThrow('服务重启确认超时');
  });
});

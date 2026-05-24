import type { SystemHeartbeat } from '@/fetch/apis/basic';

export interface RestartPollingOptions {
  beforeBootId: string;
  getHeartbeat: () => Promise<SystemHeartbeat>;
  initialDelayMs?: number;
  intervalMs?: number;
  requestTimeoutMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function withTimeout<T>(factory: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      factory(),
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('心跳请求超时')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function waitForSystemRestart(options: RestartPollingOptions): Promise<SystemHeartbeat> {
  const sleep = options.sleep || defaultSleep;
  const now = options.now || (() => Date.now());
  const initialDelayMs = options.initialDelayMs ?? 1200;
  const intervalMs = options.intervalMs ?? 1500;
  const requestTimeoutMs = options.requestTimeoutMs ?? 3000;
  const timeoutMs = options.timeoutMs ?? 60000;
  const deadline = now() + timeoutMs;

  if (initialDelayMs > 0) {
    await sleep(initialDelayMs);
  }

  while (now() <= deadline) {
    try {
      const heartbeat = await withTimeout(options.getHeartbeat, requestTimeoutMs);
      if (heartbeat.ready && heartbeat.bootId && heartbeat.bootId !== options.beforeBootId) {
        return heartbeat;
      }
    } catch {
      // 重启窗口期网络失败是正常现象，继续等待下一次心跳。
    }

    await sleep(intervalMs);
  }

  throw new Error('服务重启确认超时，请检查 BFF 进程状态后手动刷新页面');
}

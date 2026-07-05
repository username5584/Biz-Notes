type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;

function formatMessage(level: LogLevel, tag: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`;
}

export const logger = {
  debug(tag: string, message: string, data?: unknown) {
    if (!isDev) return;
    const msg = formatMessage('debug', tag, message);
    console.debug(msg, data ?? '');
  },

  info(tag: string, message: string, data?: unknown) {
    if (!isDev) return;
    const msg = formatMessage('info', tag, message);
    console.info(msg, data ?? '');
  },

  warn(tag: string, message: string, data?: unknown) {
    const msg = formatMessage('warn', tag, message);
    if (isDev) {
      console.warn(msg, data ?? '');
    }
  },

  error(tag: string, message: string, error?: unknown) {
    const msg = formatMessage('error', tag, message);
    if (isDev) {
      console.error(msg, error ?? '');
    }
  },
};

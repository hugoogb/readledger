type LogContext = Record<string, unknown>;

function formatLog(level: string, message: string, context?: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => console.log(formatLog("INFO", msg, ctx)),
  warn: (msg: string, ctx?: LogContext) => console.warn(formatLog("WARN", msg, ctx)),
  error: (msg: string, ctx?: LogContext) => console.error(formatLog("ERROR", msg, ctx)),
};

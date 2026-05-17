import pino from "pino";

export function createLogger(verbose = false) {
  return pino({
    level: verbose ? "debug" : "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        messageFormat: "[biltz] {msg}",
      },
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;

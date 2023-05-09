const pino = require("pino");

const levels = {
  http: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid",
    },
  },
  level: "debug",
  customLevels: levels,
  useOnlyCustomLevels: true,
});

export default logger;

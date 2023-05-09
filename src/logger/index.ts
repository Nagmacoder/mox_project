import logger from "./logger";

export class Logger {
  constructor() {}

  public info(logText: string): void {
    logger.info(logText);
  }

  public debug(logText: string): void {
    logger.debug(logText);
  }

  public error(logText: string): void {
    logger.error(logText);
  }
}

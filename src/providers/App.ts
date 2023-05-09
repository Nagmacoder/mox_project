import Express from "./Express";
import { Logger } from "../logger";

const logger = new Logger();

class App {
  public loadServer(): void {
    logger.info("Server :: Starting..");

    Express.init();
  }
}

export default new App();

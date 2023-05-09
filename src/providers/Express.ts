import * as express from "express";

import Locals from "./Locals";
import Routes from "./Routes";
import Kernel from "../middlewares/Kernel";
import ExceptionHandler from "../exception/Handler";
import { Logger } from "../logger";
import MailService from "../services/Auth/MailService";

const logger = new Logger();

class Express {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.mountDotEnv();
    this.mountMiddlewares();
    this.mountRoutes();
  }

  private mountDotEnv(): void {
    this.express = Locals.init(this.express);
  }

  private mountMiddlewares(): void {
    this.express = Kernel.init(this.express);
  }

  private mountRoutes(): void {
    this.express = Routes.mountAuthApi(this.express);
    this.express = Routes.mountBrandApi(this.express);
    this.express = Routes.mountAudienceApi(this.express);
    this.express = Routes.mountCampaignApi(this.express);
    this.express = Routes.mountConnectionApi(this.express);
  }

  public init(): any {
    const { port, url } = Locals.config();

    // Will register exception / error handlers
    this.express.use(ExceptionHandler.clientErrorHandler);
    this.express.use(ExceptionHandler.errorHandler);
    this.express = ExceptionHandler.notFoundHandler(this.express);
    const server = this.express
      .listen(port, () => {
        return logger.info(`Server :: Running @ ${url}`);
      })
      .on("error", (error) => {
        return logger.error(`Error: ", ${error.message}`);
      });
    server.timeout = 120000;
    const mailService = MailService.getInstance();
    (async () => {
      try {
        await mailService.createConnection();
        logger.info("Mail Server Connected");
      } catch (err) {
        logger.error(JSON.stringify(err.message));
      }
    })();
  }
}

export default new Express();

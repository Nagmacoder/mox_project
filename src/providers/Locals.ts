import { Application } from "express";
import * as dotenv from "dotenv";

dotenv.config();

class Locals {
  public static config(): any {
    const port = process.env.PORT || 8080;
    const name = process.env.APP_NAME;
    const url = process.env.APP_URL || `http://localhost:${process.env.PORT}`;
    const apiPrefix = "/api/v1/mox";

    return { port, name, url, apiPrefix };
  }

  public static init(_express: Application): Application {
    _express.locals.app = this.config();
    return _express;
  }
}

export default Locals;

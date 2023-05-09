import { Application } from "express";
import { Logger } from "../logger";
import Locals from "../providers/Locals";

const logger = new Logger();

class Handler {
  public static notFoundHandler(_express: Application) {
    const apiPrefix = Locals.config().apiPrefix;

    _express.use("*", (req, res) => {
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      logger.error(`Path '${req.originalUrl}' not found [IP: '${ip}']`);

      if (req.xhr || req.originalUrl.includes(`/${apiPrefix}/`)) {
        return res.status(404).json({ error: "Not Found" });
      }
      return res.status(404).json({ error: "Not Found" });
    });

    return _express;
  }

  public static clientErrorHandler(
    err: any,
    req: any,
    res: any,
    next: any
  ): any {
    logger.error(err.stack);

    if (req.xhr) {
      return res.status(500).send({ error: "Something went wrong!" });
    } else {
      return next(err);
    }
  }

  public static errorHandler(req: any, res: any, next: any): any {
    res.status(500);
    console.log("THIS MIDDLEWARE");

    if (!Object.keys(req.body).length)
      return res.status(400).send({ message: "Invalid Body parameters" });
    next();
  }
}

export default Handler;

import * as cors from "cors";
import { Application } from "express";
import { Logger } from "../logger";

// import Locals from "../providers/Locals";

const logger = new Logger();

class CORS {
  public mount(_express: Application): Application {
    logger.info("Booting the 'CORS' middleware...");
    // TODO - will add array of urls
    // const options = {
    //   origin: "http://localhost:3000",
    //   optionsSuccessStatus: 200,
    // };
    _express.use(cors());
    _express.options("*", cors());
    return _express;
  }
}

export default new CORS();

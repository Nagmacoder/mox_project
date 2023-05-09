import { Application } from "express";
import * as passport from "passport";

import { Logger } from "../logger";
import JWTStrategy from "../config/passportStrategy";

const logger = new Logger();

class Passport {
  public mountPackage(_express: Application): Application {
    _express = _express.use(passport.initialize());
    this.mountJwtStrategy();
    return _express;
  }

  public mountJwtStrategy(): void {
    try {
      JWTStrategy.init(passport);
    } catch (err) {
      logger.error(err);
    }
  }
}

export default new Passport();

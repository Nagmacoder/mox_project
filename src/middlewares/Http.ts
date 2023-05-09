import { Application } from "express";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
// import * as expressSession from "express-session";
import Passport from "../providers/Passport";

class Http {
  public static mount(_express: Application): Application {
    _express.use(bodyParser.json());
    _express.use(bodyParser.urlencoded({ extended: false }));
    // _express.use(expressSession);
    // Will add more middlewares here if needed like express validator, etc.

    _express.use(express.static("public"));

    _express = Passport.mountPackage(_express);

    return _express;
  }
}

export default Http;

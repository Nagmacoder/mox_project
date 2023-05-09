import { Application } from "express";
import {
  AuthRouter,
  BrandRouter,
  AudienceRouter,
  CampaignRouter,
  ProviderConnRouter,
} from "../routes";
import Locals from "./Locals";

class Routes {
  public mountAuthApi(_express: Application): Application {
    return _express.use(Locals.config().apiPrefix, AuthRouter);
  }

  public mountBrandApi(_express: Application): Application {
    return _express.use(Locals.config().apiPrefix, BrandRouter);
  }

  public mountAudienceApi(_express: Application): Application {
    return _express.use(Locals.config().apiPrefix, AudienceRouter);
  }

  public mountCampaignApi(_express: Application): Application {
    return _express.use(Locals.config().apiPrefix, CampaignRouter);
  }

  public mountConnectionApi(_express: Application): Application {
    return _express.use(Locals.config().apiPrefix, ProviderConnRouter);
  }
}

export default new Routes();

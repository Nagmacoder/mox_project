import { Router } from "express";
import * as passport from "passport";
import {
  CreateCampaignCtrl,
  GetCampaignByIDCtrl,
  GetCampaignsByBrandCtrl,
  GetAllCampaignsCtrl,
  UpdateCampaignCtrl,
  CampaignCreativeCtrl,
  GetCreativesByCampaignCtrl,
} from "../controllers/Campaign";
import { ImageUpload, CreativeUpload } from "../middlewares/multer";

const router = Router();
router.post(
  "/user/brand/campaign/",
  passport.authenticate("jwt", { session: false }),
  ImageUpload.fields([{ name: "previewImage", maxCount: 1 }]),
  CreateCampaignCtrl
);

router.post(
  "/user/brand/campaign/creatives/",
  passport.authenticate("jwt", { session: false }),
  CreativeUpload.fields([{ name: "creative",  maxCount: 10 }]),
  CampaignCreativeCtrl
);

router.get(
  "/user/brand/campaign/creatives/",
  passport.authenticate("jwt", { session: false }),
  GetCreativesByCampaignCtrl
);

router.put(
  "/user/brand/campaign/:campaignId",
  passport.authenticate("jwt", { session: false }),
  UpdateCampaignCtrl
);

router.post(
  "/user/brand/getCampaign/",
  passport.authenticate("jwt", { session: false }),
  GetCampaignByIDCtrl
);

router.get(
  "/user/brand/getCampaignsByBrand/",
  passport.authenticate("jwt", { session: false }),
  GetCampaignsByBrandCtrl
);

router.get(
  "/user/brand/getAllCampaigns",
  passport.authenticate("jwt", { session: false }),
  GetAllCampaignsCtrl
);

export default router;

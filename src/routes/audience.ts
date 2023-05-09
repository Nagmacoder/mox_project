import { Router } from "express";
import * as passport from "passport";
import {
  CreateAudienceCtrl,
  GetAllAudienceOfBrandCtrl,
  GetAudienceByIdCtrl,
  UpdateAudienceCtrl,
  GetAudienceFieldsInfoCtrl,
} from "../controllers/Audience";

const router = Router();

// Todo - Remove query params in post request
router.post(
  "/brand/audience/",
  passport.authenticate("jwt", { session: false }),
  CreateAudienceCtrl
);

router.put(
  "/brand/audience/:audienceId",
  passport.authenticate("jwt", { session: false }),
  UpdateAudienceCtrl
);

router.get(
  "/brand/getAllAudiences/",
  passport.authenticate("jwt", { session: false }),
  GetAllAudienceOfBrandCtrl
);

router.get(
  "/brand/getDetailsOfAudience/:audienceId",
  passport.authenticate("jwt", { session: false }),
  GetAudienceByIdCtrl
);

router.get(
  "/brand/getAudienceFieldsInfo/",
  passport.authenticate("jwt", { session: false }),
  GetAudienceFieldsInfoCtrl
);

export default router;

import { Router } from "express";
import * as passport from "passport";
import {
  CreateBrandCtrl,
  GetAllBrandsCtrl,
  GetBrandByIdCtrl,
  GetBrandByBusinessEntCtrl,
  UpdateBrandCtrl,
  GetAllBusinessCategoriesCtrl,
  GetAllCountriesCtrl,
  GetAllLanguagesCtrl,
} from "../controllers/Brand";
import { ImageUpload } from "../middlewares/multer";

const router = Router();

// Todo - Remove query params in post request
router.post(
  "/user/brand/",
  passport.authenticate("jwt", { session: false }),
  ImageUpload.fields([{ name: "brandLogo", maxCount: 1 }]),
  CreateBrandCtrl
);

router.put(
  "/user/brand/:brandId",
  passport.authenticate("jwt", { session: false }),
  ImageUpload.none(),
  UpdateBrandCtrl
);

router.get(
  "/getAllBrands",
  passport.authenticate("jwt", { session: false }),
  GetAllBrandsCtrl
);

router.get(
  "/getBrand/:brandId",
  passport.authenticate("jwt", { session: false }),
  GetBrandByIdCtrl
);

router.get(
  "/brand",
  passport.authenticate("jwt", { session: false }),
  GetBrandByBusinessEntCtrl
);

router.get(
  "/brand/getAllBusinessCategories",
  passport.authenticate("jwt", { session: false }),
  GetAllBusinessCategoriesCtrl
);

router.get(
  "/getAllCountries",
  passport.authenticate("jwt", { session: false }),
  GetAllCountriesCtrl
);

router.get(
  "/getAllLanguages",
  passport.authenticate("jwt", { session: false }),
  GetAllLanguagesCtrl
);

export default router;

import { Router } from "express";
import * as passport from "passport";
import {
  LoginController,
  SignupController,
  GetUserInfoCtrl,
  VerifyMailCtrl,
  PasswordResetTokenCtrl,
  ResetPasswordCtrl,
  ChangePasswordCtrl,
  GetUsersUnVerifiedCtrl,
  UserAccountActionCtrl,
  GetUserInfoByBrandId,
} from "../controllers/Auth";
import { body } from "express-validator";

const router = Router();

router.post(
  "/auth/login",
  body("email", "Email is invalid")
    .notEmpty()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false }),
  body("password").notEmpty().isLength({ min: 6 }),
  LoginController
);
router.post("/auth/signup", SignupController);

router.get(
  "/user/info",
  passport.authenticate("jwt", { session: false }),
  GetUserInfoCtrl
);

router.post("/user/verifyEmail", VerifyMailCtrl);

router.post("/user/auth/passwordResetToken", PasswordResetTokenCtrl);

router.put("/user/auth/resetPassword/:token", ResetPasswordCtrl);

router.put(
  "/user/auth/changePassword/:userId",
  passport.authenticate("jwt", { session: false }),
  ChangePasswordCtrl
);

router.get("/users/unverified", GetUsersUnVerifiedCtrl);

router.post("/user/accountAction", UserAccountActionCtrl);

router.get("/users", GetUserInfoByBrandId);

export default router;

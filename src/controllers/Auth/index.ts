import { Request, Response } from "express";

export { default as LoginController } from "./Login";
export { default as SignupController } from "./Signup";
import {
  GetUserInfoByBrandIdService,
  UnVerifiedUsersInfoService,
  UserAccountActionService,
  UserInfoService,
} from "../../services/Auth/UserInfoService";
import prisma from "../../config/db";
import {
  PasswordResetToken,
  ChangePassword,
  ResetPassword,
} from "../../services/Auth/PasswordReset";
import { validationResult } from "express-validator";

export async function GetUserInfoCtrl(req: Request, res: Response) {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "userId not found", data: null });
  }

  try {
    const user = await UserInfoService(userId);
    return res.json({ success: true, data: user, error: null });
  } catch (err) {
    return res.json({ success: false, data: null, error: err.message });
  }
}

export async function VerifyMailCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const { code } = req.body;
  try {
    const user = await prisma.userAccount.findMany({
      where: {
        AND: [{ code }],
      },
    });
    if (user.length) {
      const updatedUser = await prisma.userAccount.updateMany({
        where: {
          AND: [{ code }],
        },
        data: {
          is_email_verified: true,
        },
      });
      return res.json({
        success: true,
        message: "Email Verified Successfully",
      });
    }
    return res.json({
      success: false,
      message: "There is problem occured in email verification",
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
}

export async function PasswordResetTokenCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const { email } = req.body;

  try {
    const user = await PasswordResetToken(email, req);
    return res.json({
      success: true,
      message: "Password reset link sent to your email successfully",
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

export async function ResetPasswordCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const token = req.params.token;
  const { newPassword } = req.body;
  try {
    const password = await ResetPassword(token, newPassword);
    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

export async function ChangePasswordCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const userId = Number(req.params.userId);
  const { newPassword, oldPassword } = req.body;
  try {
    const password = await ChangePassword(userId, oldPassword, newPassword);
    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

export async function GetUsersUnVerifiedCtrl(req: Request, res: Response) {
  try {
    const user = await UnVerifiedUsersInfoService();
    return res.json({ success: true, data: user, error: null });
  } catch (err) {
    return res.json({ success: true, data: [], error: err.message });
  }
}

export async function UserAccountActionCtrl(req: Request, res: Response) {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, errors: validationErrors.array() });
  }
  const { email, user_id, status } = req.body;

  if (!email || !user_id || !status) {
    return res.status(400).json({
      success: false,
      error: "Missing email, user_id, or status in request body",
    });
  }
  try {
    const accountStatus =
      status === "VERIFIED"
        ? 1
        : status === "BLOCKED"
        ? 2
        : status === "REJECTED"
        ? 3
        : 0;

    const user = await UserAccountActionService(email, user_id, accountStatus);
    return res.json({
      success: true,
      data: "User account status has been updated.",
      error: null,
    });
  } catch (err) {
    return res.json({ success: false, data: null, error: err.message });
  }
}

export async function GetUserInfoByBrandId(req: Request, res: Response) {
  const brandId = Number(req.query.brandId);
  try {
    const brandData = await GetUserInfoByBrandIdService(brandId);

    res.json({ success: true, error: null, data: brandData });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

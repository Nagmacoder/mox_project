import { Request } from "express";
import prisma from "../../config/db";
import { IUser } from "../../interfaces";
import {
  generateVerifyCode,
  generateHashedPassword,
  validPassword,
} from "../../lib/utils";
import resetPasswordTemplate from "../../templates/resetPassword";
import MailService from "./MailService";

export async function PasswordResetToken(email: string, req: Request) {
  const user: IUser[] = await prisma.userAccount.findMany({
    where: { AND: [{ email }] },
  });

  if (!user.length) throw new Error("User not found with this email");

  const token = generateVerifyCode();
  await prisma.userAccount.update({
    where: { user_id: user[0].user_id },
    data: {
      resetToken: token,
    },
  });
  const mailTemplate = resetPasswordTemplate(token);
  const mailService = MailService.getInstance();
  await mailService.sendMail(req.headers["X-Request-Id"], {
    to: user[0].email,
    subject: "Reset Password",
    html: mailTemplate.html,
  });

  return user[0];
}

export async function ResetPassword(token: string, newPassword: string) {
  const user: IUser[] = await prisma.userAccount.findMany({
    where: { AND: [{ resetToken: token }] },
  });

  if (!user.length) throw new Error("Password Link is broken");

  const { hash, salt } = generateHashedPassword(newPassword);

  await prisma.userAccount.update({
    where: { user_id: user[0].user_id },
    data: {
      password_hash: hash,
      password_salt: salt,
    },
  });

  return hash;
}

export async function ChangePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
) {
  const user = await prisma.userAccount.findUnique({
    where: { user_id: userId },
  });

  if (!user) throw new Error("User not found with this user ID");

  const isValidPassword = validPassword(
    oldPassword,
    user.password_hash,
    user.password_salt
  );
  if (!isValidPassword) throw new Error("Invalid Old Password");

  const { hash, salt } = generateHashedPassword(newPassword);

  await prisma.userAccount.update({
    where: { user_id: userId },
    data: {
      password_hash: hash,
      password_salt: salt,
    },
  });

  return hash;
}

import { Request } from "express";
import prisma from "../../config/db";
import {
  generateHashedPassword,
  generatePID,
  generateVerifyCode,
} from "../../lib/utils";
import { ISignup } from "../../interfaces";
import verifyEmailTemplate from "../../templates/verifyEmailTemplate";
import MailService from "./MailService";

export async function SignupService(newUser: ISignup, req: Request) {
  const userInDb = await prisma.userAccount.findMany({
    where: {
      OR: [{ email: newUser.email }],
    },
  });

  if (userInDb.length)
    throw new Error("User already registered with this credentials");

  const entity = await prisma.businessEntity.create({
    data: {
      business_entity_type_id: 3,
      given_name: newUser.given_name,
      family_name: newUser.family_name,
      email: newUser.email,
      display_name: newUser.display_name,
    },
  });

  const { hash, salt } = generateHashedPassword(newUser.password);
  const pID = generatePID(newUser.email.toLocaleLowerCase());
  const code = generateVerifyCode();

  const user = await prisma.userAccount.create({
    data: {
      email: newUser.email,
      password_hash: hash,
      password_salt: salt,
      p_id: pID,
      business_entity_id: entity.business_entity_id,
      login_as: 2,
      is_email_verified: false,
      code,
    },
  });

  if (user) {
    const emailTemplate = verifyEmailTemplate(code);
    const mailService = MailService.getInstance();
    await mailService.sendMail(req.headers["X-Request-Id"], {
      to: user.email,
      subject: "Verify Email",
      html: emailTemplate.html,
    });
    return user;
  }
}

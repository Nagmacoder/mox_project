import prisma from "../../config/db";
import { issueJWT, validPassword } from "../../lib/utils";
import { IUser } from "../../interfaces";
import { Logger } from "../../logger";

const logger = new Logger();

export async function LoginService(email: string, password: string) {
  logger.info("HIT LOGIN SERVICE");
  const user: IUser[] = await prisma.userAccount.findMany({
    where: {
      OR: [{ email }],
    },
  });

  if (!user.length) throw new Error("User not found with this credentials");
  const isValid = validPassword(
    password,
    user[0].password_hash,
    user[0].password_salt
  );
  if (!isValid) {
    throw new Error("Invalid Password");
  }
  const { token, expires } = issueJWT(user[0]);
  return { token, user: user, expiresIn: expires };
}

import { pbkdf2Sync, randomBytes, createHash } from "crypto";
import { IUser } from "../interfaces";

const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "../secrets/", "id_rsa_priv.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");

/**
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 *
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */

export function validPassword(password: string, hash: string, salt: string) {
  let hashVerify = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString(
    "hex"
  );
  return hash === hashVerify;
}

/**
 *
 * @param {*} password - The password string that the user inputs to the password field in the register form
 *
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 * */

export function generateHashedPassword(password: string) {
  let salt = randomBytes(32).toString("hex");
  let hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

  return { salt, hash };
}

export function generatePID(email: string) {
  const hash = createHash("sha256").update(email).digest("hex");
  return hash;
}

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the DB user ID
 */

export function issueJWT(user: IUser) {
  const userId = user.user_id;
  const expiresIn = "1d";

  const payload = {
    sub: userId,
    iat: Date.now(),
  };

  const privateKey = {
    key: PRIV_KEY,
    passphrase: "Jerry is a cool boy",
  };

  const signedToken = jwt.sign(payload, privateKey, {
    expiresIn,
    algorithm: "RS256",
  });

  return {
    token: `Bearer ${signedToken}`,
    expires: expiresIn,
  };
}

export function generateVerifyCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { LoginService } from "../../services/Auth/LoginService";
import { Logger } from "../../logger";

const logger = new Logger();

export default async function LoginController(req: Request, res: Response) {
  const emailReq = req.body.email.toLowerCase();
  const password = req.body.password;
  logger.info("Login Controller");

  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, errors: validationErrors.array() });
  }

  try {
    const user = await LoginService(emailReq, password);
    res.json({
      success: true,
      error: null,
      data: user,
    });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message, data: null });
  }
}

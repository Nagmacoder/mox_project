import { Request, Response } from "express";
import { SignupService } from "../../services/Auth/SignupService";

export default async function SignupController(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const { given_name, family_name, email, display_name, password } = req.body;

  try {
    const user = await SignupService(
      {
        given_name,
        family_name,
        email,
        display_name,
        password,
      },
      req
    );
    res.json({
      success: true,
      error: null,
      data: user,
      message: "User Registered Successfully",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

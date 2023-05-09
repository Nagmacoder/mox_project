import { Request, Response } from "express";
import {
  CreateAudience,
  GetAllAudienceOfBrand,
  GetAudienceById,
  UpdateAudience,
  GetAudienceFieldsInfo,
} from "../../services/Audience";

export async function CreateAudienceCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const { brand_id, fields } = req.body;

  try {
    const audience = await CreateAudience({
      brandId: Number(brand_id),
      fields,
    });
    res.json({
      success: true,
      error: null,
      data: audience,
      message: "Audience Created",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function UpdateAudienceCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const audienceId = Number(req.params.audienceId);
  const { brand_id, fields } = req.body;

  try {
    const audience = await UpdateAudience({
      audienceId,
      brandId: Number(brand_id),
      fields,
    });
    res.json({
      success: true,
      error: null,
      data: audience,
      message: "Audience Updated",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllAudienceOfBrandCtrl(req: Request, res: Response) {
  const brandId = req.query.brandId;
  if (!brandId)
    return res
      .status(400)
      .send({ success: false, message: "BrandId not found" });

  try {
    const audiences = await GetAllAudienceOfBrand(Number(brandId));
    res.json({ success: true, error: null, data: audiences });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAudienceByIdCtrl(req: Request, res: Response) {
  const audienceId = Number(req.params.audienceId);

  try {
    const audience = await GetAudienceById(audienceId);
    res.json({ success: true, error: null, data: audience });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAudienceFieldsInfoCtrl(req: Request, res: Response) {
  try {
    const fieldsInfo = await GetAudienceFieldsInfo();
    res.json({ success: true, error: null, data: fieldsInfo });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

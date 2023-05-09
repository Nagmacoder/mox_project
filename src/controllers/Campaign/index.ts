import { Request, Response } from "express";
import {
  CreateCampaign,
  GetCampaignByID,
  GetCampaignsByBrand,
  GetAllCampaigns,
  UpdateCampaign,
  CampaignCreatives,
  GetCreativesByCampaign,
} from "../../services/Campaign";

export async function CreateCampaignCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, error: "Invalid Body parameters", data: null });

  const { brand_id, audience_id, fields } = req.body;
  let previewImage = "";
  //@ts-ignore
  let files: any = req.files;
  if (files != undefined && files.previewImage != undefined) {
    let path = files.previewImage[0].path;
    previewImage = path.substring(path.indexOf("/uploads"));
  }
  console.log("Preview Image path: ", previewImage);

  // Put check on the mandatory fields
  try {
    const campaign = await CreateCampaign({
      brand_id: Number(brand_id),
      audience_id: Number(audience_id),
      previewImage,
      fields,
    });
    return res.json({
      success: true,
      error: null,
      message: "Campaign Created",
      data: campaign,
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function UpdateCampaignCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const campaignId = Number(req.params.campaignId);
  const { brand_id, audience_id, fields } = req.body;
  let previewImage = "";
  //@ts-ignore
  let files: any = req.files;
  if (files != undefined && files.previewImage != undefined) {
    let path = files.previewImage[0].path;
    previewImage = path.substring(path.indexOf("/uploads"));
  }
  try {
    const campaign = await UpdateCampaign({
      campaignId,
      brandId: Number(brand_id),
      audienceId: Number(audience_id),
      previewImage,
      fields,
    });
    res.json({
      success: true,
      error: null,
      data: campaign,
      message: "Campaign Updated",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetCampaignByIDCtrl(req: Request, res: Response) {
  const { brand_id, campaign_id } = req.body;
  const userId = req.query.userId;

  if (!brand_id || !campaign_id || !userId)
    return res.status(400).json({
      success: false,
      error: "Needed query params not found",
      data: null,
    });

  try {
    const campaign = await GetCampaignByID(
      Number(campaign_id),
      Number(brand_id),
      Number(userId)
    );
    return res.json({ success: true, error: null, data: campaign });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetCampaignsByBrandCtrl(req: Request, res: Response) {
  const brandId = Number(req.query.brandId);
  const requestStatus = req.query.requestStatus;

  if (!brandId)
    return res
      .status(400)
      .json({ success: false, error: "brandId not found", data: null });

  try {
    const campaigns = await GetCampaignsByBrand(
      brandId,
      requestStatus as string
    );
    return res.json({ success: true, error: null, data: campaigns });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllCampaignsCtrl(req: Request, res: Response) {
  try {
    const campaigns = await GetAllCampaigns();
    return res.json({ success: true, error: null, data: campaigns });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function CampaignCreativeCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const { campaign_id, banner_type, size, format, link } = req.body;
  let creativeFiles: any[] = [];
  let files: any = req.files;

  if (Array.isArray(files.creative)) {
    creativeFiles = files.creative.map((file: any) => {
      let path = file.path;
      return path.substring(path.indexOf("/uploads"));
    });
  } else if (files.creative != undefined) {
    creativeFiles.push(files.creative.path.substring(files.creative.path.indexOf("/uploads")));
  }

  let urls: string[] = [];
  if (Array.isArray(link)) {
    urls = link.filter((url) => typeof url === 'string' && url.trim().length > 0);
    if (urls.length === 0) {
      throw new Error('At least one valid URL is required.');
    }
  } else if (typeof link === 'string' && link.trim().length > 0) {
    urls.push(link);
  } else {
    throw new Error('Invalid URL format.');
  }

  if (creativeFiles.length > 0) {
    creativeFiles.forEach((file) => {
      urls.push(file);
    });
  }

  try {
    const creativeRes = await CampaignCreatives({
      campaign_id,
      banner_type,
      size,
      format,
      urls,
    });
    return res.json({
      success: true,
      error: null,
      data: creativeRes,
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetCreativesByCampaignCtrl(req: Request, res: Response) {
  const campaignId = Number(req.query.campaignId);
  if (!campaignId) {
    return res.json({
      success: false,
      error: "Campaign ID not found",
      data: null,
    });
  }

  try {
    const creatives = await GetCreativesByCampaign(campaignId);
    res.json({ success: true, data: creatives, error: null });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

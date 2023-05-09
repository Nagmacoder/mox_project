import { Request, Response } from "express";
import {
  CreateBrand,
  GetAllBrands,
  GetBrandById,
  GetBrandByBusinessEntity,
  UpdateBrand,
  GetAllBusinessCategories,
  GetAllCountries,
  GetAllLanguages,
} from "../../services/Brand";
import { Logger } from "../../logger";

const logger = new Logger();

export async function CreateBrandCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const {
    business_entity_id,
    brand_name,
    website,
    about,
    online_store,
    mau,
    site_category,
    audience_location,
    languages,
    social_media_handles,
  } = req.body;
  // Body Validations
  let brandLogoPath = "";
  //@ts-ignore
  let files: any = req.files;
  if (files != undefined && files.brandLogo != undefined) {
    let path = files.brandLogo[0].path;
    brandLogoPath = path.substring(path.indexOf("/uploads"));
  }
  console.log("brand logo path: ", brandLogoPath);
  try {
    const brand = await CreateBrand({
      businessEntityId: Number(business_entity_id),
      brand_name,
      logo: brandLogoPath,
      website,
      about,
      online_store,
      mau,
      site_category,
      audience_location,
      languages,
      social_media_handles,
    });
    return res.json({
      success: true,
      error: null,
      data: brand,
      message: "Brand Created",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function UpdateBrandCtrl(req: Request, res: Response) {
  if (!Object.keys(req.body).length)
    return res
      .status(400)
      .send({ success: false, message: "Invalid Body parameters" });

  const brandId = Number(req.params.brandId);
  const {
    business_entity_id,
    brand_name,
    website,
    about,
    online_store,
    mau,
    site_category,
    audience_location,
    languages,
    social_media_handles,
  } = req.body;

  // let brandLogoPath = "";
  //@ts-ignore
  // let path: string = req.files.brandLogo[0].path;
  // brandLogoPath = path.substring(path.indexOf("/uploads"));

  try {
    const updatedBrand = await UpdateBrand({
      businessEntityId: Number(business_entity_id),
      brandId,
      brand_name,
      // logo: brandLogoPath,
      website,
      about,
      online_store,
      mau,
      site_category,
      audience_location,
      languages,
      social_media_handles,
    });
    return res.json({
      success: true,
      error: null,
      data: updatedBrand,
      message: "Brand Created",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllBrandsCtrl(req: Request, res: Response) {
  try {
    const brands = await GetAllBrands();
    res.json({ success: true, error: null, data: brands });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetBrandByIdCtrl(req: Request, res: Response) {
  const brandId = Number(req.params.brandId);
  try {
    const brand = await GetBrandById(brandId);
    res.json({ success: true, error: null, data: brand });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetBrandByBusinessEntCtrl(req: Request, res: Response) {
  const businessEntityId = Number(req.query.businessEntityId);
  if (!businessEntityId) {
    return res.json({
      success: false,
      error: "businessEntityId not found",
      data: null,
    });
  }

  try {
    const brands = await GetBrandByBusinessEntity(businessEntityId);
    res.json({ success: true, error: null, data: brands });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllBusinessCategoriesCtrl(
  req: Request,
  res: Response
) {
  try {
    const businessCategories = await GetAllBusinessCategories();
    res.json({ success: true, error: null, data: businessCategories });
  } catch (err) {
    logger.error(JSON.stringify(err.message));
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllCountriesCtrl(req: Request, res: Response) {
  try {
    const countries = await GetAllCountries();
    res.json({ success: true, error: null, data: countries });
  } catch (err) {
    logger.error(JSON.stringify(err.message));
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function GetAllLanguagesCtrl(req: Request, res: Response) {
  try {
    const languages = await GetAllLanguages();
    res.json({ success: true, error: null, data: languages });
  } catch (err) {
    logger.error(JSON.stringify(err.message));
    res.json({ success: false, error: err.message, data: null });
  }
}

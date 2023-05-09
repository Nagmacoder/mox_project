import { ICreateBrand } from "../../interfaces";
import { Logger } from "../../logger";
import prisma from "../../config/db";

const logger = new Logger();

export async function CreateBrand(brandInfo: ICreateBrand) {
  const {
    businessEntityId,
    brand_name,
    website,
    logo,
    about,
    audience_location,
    online_store,
    mau,
    site_category,
    social_media_handles,
    languages,
  } = brandInfo;
  logger.debug("Create Brand Service");

  const businessEntityInDb = await prisma.businessEntity.findUnique({
    where: {
      business_entity_id: businessEntityId,
    },
  });

  if (!businessEntityInDb)
    throw new Error("Business Entity related to this ID not found");

  const brand = await prisma.brand.create({
    data: {
      business_entity_id: businessEntityId,
      brand_name,
      logo,
      website,
      about,
      audience_location,
      online_store,
      mau,
      site_category,
      social_media_handles,
      languages,
    },
  });

  return brand;
}

export async function UpdateBrand(brandInfo: any) {
  const {
    businessEntityId,
    brandId,
    brand_name,
    website,
    // logo,
    about,
    audience_location,
    online_store,
    mau,
    site_category,
    social_media_handles,
    languages,
  } = brandInfo;

  const businessEntityInDb = await prisma.businessEntity.findUnique({
    where: {
      business_entity_id: businessEntityId,
    },
  });

  if (!businessEntityInDb)
    throw new Error("Business Entity related to this ID not found");

  const brand = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brand) throw new Error("Brand not found with this brandId");

  const updateBrand = await prisma.brand.update({
    where: {
      brand_id: brandId,
    },
    data: {
      brand_name,
      website,
      // logo,
      about,
      audience_location,
      online_store,
      mau,
      site_category,
      social_media_handles,
      languages,
    },
  });

  const parsedBrand = {
    brand_id: updateBrand.brand_id,
    business_entity_id: updateBrand.business_entity_id,
    logo: updateBrand.logo,
    brand_name: updateBrand.brand_name,
    about: updateBrand.about,
    online_store: updateBrand.online_store,
    website: updateBrand.website,
    mau: updateBrand.mau,
    site_category: JSON.parse(updateBrand.site_category),
    //@ts-ignore
    audience_location: JSON.parse(updateBrand.audience_location),
    //@ts-ignore
    languages: JSON.parse(updateBrand.languages),
    //@ts-ignore
    social_media_handles: JSON.parse(updateBrand.social_media_handles),
  };
  return parsedBrand;
}

// GET list of brands - GET
export async function GetAllBrands() {
  const brands = await prisma.brand.findMany({
    include: {
      business_entity: {
        include: {
          business_entity_type: true,
        },
      },
    },
  });
  const parsedBrands = await Promise.all(
    brands.map(async (brand) => {
      const users = await prisma.userAccount.findMany({
        where: { AND: [{ business_entity_id: brand.business_entity_id }] },
      });

      return {
        brand_id: brand.brand_id,
        business_entity_id: brand.business_entity_id,
        logo: brand.logo,
        brand_name: brand.brand_name,
        about: brand.about,
        online_store: brand.online_store,
        website: brand.website,
        mau: brand.mau,
        total_users: users.length,
        new_user: false,
        site_category: JSON.parse(brand.site_category),
        //@ts-ignore
        audience_location: JSON.parse(brand.audience_location),
        //@ts-ignore
        languages: JSON.parse(brand.languages),
        //@ts-ignore
        social_media_handles: JSON.parse(brand.social_media_handles),
        created_date: brand.created_at,
        business_entity_type_name:
          brand.business_entity.business_entity_type.business_entity_type_name,
      };
    })
  );
  return parsedBrands;
}

// GET specific Brand Details by ID - GET/:id
export async function GetBrandById(id: number) {
  const brand = await prisma.brand.findUnique({
    where: {
      brand_id: id,
    },
  });

  if (!brand) throw new Error("Brand with this brand id not found");
  const parsedBrand = {
    brand_id: brand.brand_id,
    business_entity_id: brand.business_entity_id,
    logo: brand.logo,
    brand_name: brand.brand_name,
    about: brand.about,
    online_store: brand.online_store,
    website: brand.website,
    mau: brand.mau,
    site_category: JSON.parse(brand.site_category),
    //@ts-ignore
    audience_location: JSON.parse(brand.audience_location),
    //@ts-ignore
    languages: JSON.parse(brand.languages),
    //@ts-ignore
    social_media_handles: JSON.parse(brand.social_media_handles),
  };
  return parsedBrand;
}

export async function GetBrandByBusinessEntity(businessEntityId: number) {
  const businessEntityInDb = await prisma.businessEntity.findUnique({
    where: {
      business_entity_id: businessEntityId,
    },
  });

  if (!businessEntityInDb)
    throw new Error("Business Entity related to this ID not found");

  const brands = await prisma.brand.findMany({
    where: {
      business_entity_id: businessEntityId,
    },
  });
  const parsedBrands = brands.map((brand) => {
    return {
      brand_id: brand.brand_id,
      business_entity_id: brand.business_entity_id,
      logo: brand.logo,
      brand_name: brand.brand_name,
      about: brand.about,
      online_store: brand.online_store,
      website: brand.website,
      mau: brand.mau,
      site_category: JSON.parse(brand.site_category),
      //@ts-ignore
      audience_location: JSON.parse(brand.audience_location),
      //@ts-ignore
      languages: JSON.parse(brand.languages),
      //@ts-ignore
      social_media_handles: JSON.parse(brand.social_media_handles),
    };
  });

  return parsedBrands;
}

export async function GetAllBusinessCategories() {
  const businessCategories = await prisma.businessCategories.findMany();
  const categories = businessCategories.map((cateogory) => {
    return {
      id: cateogory.business_category_id,
      name: cateogory.business_category_name,
    };
  });
  return categories;
}

export async function GetAllCountries() {
  const countries = await prisma.countriesData.findMany();
  const countriesData = countries.map((country) => {
    return {
      id: country.country_id,
      country_name: country.country_name,
      country_code: country.country_code,
    };
  });
  return countriesData;
}

export async function GetAllLanguages() {
  const languages = await prisma.languages.findMany();
  const languagesData = languages.map((language) => {
    return {
      id: language.language_id,
      language: language.language_name,
      code: language.language_code,
    };
  });
  return languagesData;
}

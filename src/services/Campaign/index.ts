import {
  ICreateCampaign,
  ICampaignFields,
  ICampaignCreative,
} from "../../interfaces";
import prisma from "../../config/db";
import { GetAudienceById } from "../Audience";
import { Logger } from "../../logger";

const logger = new Logger();
// Create Campaign with given audience and brand
export async function CreateCampaign(campaignData: ICreateCampaign) {
  const { brand_id, audience_id, previewImage, fields } = campaignData;
  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brand_id,
    },
  });
  if (!brandInDb) throw new Error("Brand not found with this brand ID");
  const audienceInDb = await prisma.audience.findMany({
    where: {
      AND: [{ brand_id, audience_id }],
    },
  });
  if (!audienceInDb.length)
    throw new Error("Audience not found with this brand");

  const campaign = await prisma.campaign.create({
    data: {
      brand_id: brand_id,
      audience_id: audience_id,
      preview_image: previewImage,
    },
  });
  //@ts-ignore
  const fieldsArr: ICampaignFields[] = JSON.parse(fields);
  try {
    const campaignFields = fieldsArr.map((field) => {
      const fieldKey = Object.keys(field)[0];
      return {
        campaign_id: campaign.campaign_id,
        field_name: fieldKey,
        field_value: field[fieldKey].value,
      };
    });

    const result = await prisma.campaign_fields.createMany({
      data: campaignFields,
    });

    logger.debug(JSON.stringify(result));

    return campaign;
  } catch (err) {
    const deleted = await prisma.campaign.delete({
      where: {
        campaign_id: campaign.campaign_id,
      },
    });
    throw new Error(err.message);
  }
}

export async function UpdateCampaign(campaignData: any) {
  const { campaignId, brandId, audienceId, previewImage, fields } =
    campaignData;
  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });
  if (!brandInDb) throw new Error("Brand not found with this brand ID");
  const audienceInDb = await prisma.audience.findMany({
    where: {
      AND: [{ brand_id: brandId, audience_id: audienceId }],
    },
  });
  if (!audienceInDb.length)
    throw new Error("Audience not found with this brand");

  const campaignInDb = await prisma.campaign.findUnique({
    where: {
      campaign_id: campaignId,
    },
  });
  if (!campaignInDb)
    throw new Error("Campaign not found with this campaign ID");

  const campaignFields = await Promise.all(
    fields.map(async (field: any) => {
      const fieldKey = Object.keys(field)[0];
      const fieldInDb = await prisma.campaign_fields.findMany({
        where: { AND: [{ campaign_id: campaignId, field_name: fieldKey }] },
      });
      return {
        field_id: fieldInDb[0].field_id,
        field_name: fieldInDb[0].field_name,
        field_value: field[fieldKey].value,
      };
    })
  );
  // console.log(campaignFields);
  await Promise.all(
    campaignFields.map(async (field: any) => {
      await prisma.campaign_fields.update({
        where: { field_id: field.field_id },
        data: {
          field_name: field.field_name,
          field_value: field.field_value,
        },
      });
    })
  );

  return campaignInDb;
}

// GET Campaign by campaignID
export async function GetCampaignByID(
  campaignId: number,
  brandId: number,
  userId: number
) {
  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brandInDb) throw new Error("Brand not found with this brand ID");

  const campaignInDb = await prisma.campaign.findUnique({
    where: {
      campaign_id: campaignId,
    },
  });

  const audienceInDb = await prisma.audience.findMany({
    where: {
      AND: [{ brand_id: brandId, audience_id: campaignInDb.audience_id }],
    },
  });

  if (!audienceInDb.length)
    throw new Error("Audience not found with this brand");

  const audience = await GetAudienceById(audienceInDb[0].audience_id);
  const campaignfields = await prisma.campaign_fields.findMany({
    where: {
      AND: [{ campaign_id: campaignId }],
    },
  });
  let fieldsArr: any[] = [];
  campaignfields.forEach((field) =>
    fieldsArr.push({ [field.field_name]: field.field_value })
  );
  let isEditable = true;
  if (campaignInDb.status === "OFFER_ACCEPTED") {
    isEditable = false;
  }

  const requestStatus = await prisma.connectionRequest.findMany({
    where: {
      AND: [
        {
          sender_campaignId: campaignId,
          sender_brandId: brandId,
          sender_userId: userId,
        },
      ],
    },
  });

  return {
    campaign_id: campaignId,
    brand_id: brandId,
    status: campaignInDb.status,
    request_status: requestStatus[0]?.requestStatus,
    preview_image: campaignInDb.preview_image,
    is_editable: isEditable,
    campaignData: fieldsArr,
    audience,
  };
}

// GET Campaigns by brandID
export async function GetCampaignsByBrand(
  brandId: number,
  requestStatus: string
) {
  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brandInDb) throw new Error("Brand not found with this brand ID");

  const campaigns = await prisma.campaign.findMany({
    where: {
      // @ts-ignore
      OR: [{ brand_id: brandId, status: requestStatus }],
    },
  });

  const campaignData = await Promise.all(
    campaigns.map(async (campaign) => {
      const campaignFields = await prisma.campaign_fields.findMany({
        where: {
          AND: [{ campaign_id: campaign.campaign_id }],
        },
      });

      const campaignArr: any[] = [];
      campaignFields.forEach((field) =>
        campaignArr.push({ [field.field_name]: field.field_value })
      );

      return {
        brand_id: brandId,
        campaign_id: campaign.campaign_id,
        audience_id: campaign.audience_id,
        preview_image: campaign.preview_image,
        status: campaign.status,
        created_at: campaign.created_at,
        fields: campaignArr,
      };
    })
  );

  const sortedCampaigns = campaignData.sort(
    // @ts-ignore
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return sortedCampaigns;
}

// GET all campaigns
export async function GetAllCampaigns() {
  const campaigns = await prisma.campaign.findMany();

  const campaignData = await Promise.all(
    campaigns.map(async (campaign) => {
      const campaignFields = await prisma.campaign_fields.findMany({
        where: {
          AND: [{ campaign_id: campaign.campaign_id }],
        },
      });

      const brandInDb = await prisma.brand.findUnique({
        where: {
          brand_id: campaign.brand_id,
        },
      });
      const brandDetails = {
        brand_name: brandInDb.brand_name,
        brand_logo: brandInDb.logo,
      };

      const campaignArr: any[] = [];
      campaignFields.forEach((field) =>
        campaignArr.push({ [field.field_name]: field.field_value })
      );

      return {
        brand_id: campaign.brand_id,
        brand: brandDetails,
        campaign_id: campaign.campaign_id,
        audience_id: campaign.audience_id,
        preview_image: campaign.preview_image,
        status: campaign.status,
        created_at: campaign.created_at,
        fields: campaignArr,
      };
    })
  );

  const sortedCampaigns = campaignData.sort(
    // @ts-ignore
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return sortedCampaigns;
}

export async function CampaignCreatives(creativeInfo: ICampaignCreative) {
  const { campaign_id, banner_type, size, format, urls } = creativeInfo;

  const creativeRes = await prisma.campaignCreatives.create({
    data: {
      campaign_id: Number(campaign_id),
      banner_type,
      banner_size: size,
      banner_format: format,
      // @ts-ignore
      url: urls,
    },
  });

  return creativeRes;
}

export async function GetCreativesByCampaign(campaignId: number) {
  const campaign = await prisma.campaign.findUnique({
    where: {
      campaign_id: campaignId,
    },
  });
  if (!campaign) {
    throw new Error("Campaign not found with this ID");
  }

  const creatives = await prisma.campaignCreatives.findMany({
    where: {
      AND: [{ campaign_id: campaignId }],
    },
  });
  return creatives;
}

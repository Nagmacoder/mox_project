import prisma from "../../config/db";
import { ICreateAudience } from "../../interfaces";
import { Logger } from "../../logger";

const logger = new Logger();

// Create Audience/Campaign - POST
export async function CreateAudience(audienceData: ICreateAudience) {
  const { brandId, fields } = audienceData;

  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brandInDb) throw new Error("Brand not found with this brand ID");
  const audience = await prisma.audience.create({
    data: {
      brand_id: brandId,
    },
  });

  try {
    const audienceFields = fields.map((field) => {
      const fieldKey = Object.keys(field)[0];
      return {
        audience_id: audience.audience_id,
        field_name: fieldKey,
        field_value: field[fieldKey].value,
        is_mandatory: field[fieldKey].mandatory,
      };
    });

    const result = await prisma.audience_fields.createMany({
      data: audienceFields,
    });

    logger.debug(JSON.stringify(result));

    return audience;
  } catch (err) {
    const deleted = await prisma.audience.delete({
      where: {
        audience_id: audience.audience_id,
      },
    });
    throw new Error(err.message);
  }
}

export async function UpdateAudience(audienceData: any) {
  const { brandId, audienceId, fields } = audienceData;

  const brandInDb = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brandInDb) throw new Error("Brand not found with this brand ID");

  const audienceInDb = await prisma.audience.findUnique({
    where: {
      audience_id: audienceId,
    },
  });

  if (!audienceInDb)
    throw new Error("Audience not found with this audience ID");

  const audienceFields = await Promise.all(
    fields.map(async (field: any) => {
      const fieldKey = Object.keys(field)[0];
      const fieldInDb = await prisma.audience_fields.findMany({
        where: {
          AND: [{ audience_id: audienceId, field_name: fieldKey }],
        },
      });
      return {
        field_id: fieldInDb[0].field_id,
        field_name: fieldInDb[0].field_name,
        field_value: field[fieldKey].value,
        is_mandatory:
          field[fieldKey].mandatory == undefined
            ? false
            : field[fieldKey].mandatory,
      };
    })
  );

  await Promise.all(
    audienceFields.map(async (field: any) => {
      await prisma.audience_fields.update({
        where: {
          field_id: field.field_id,
        },
        data: {
          field_name: field.field_name,
          field_value: field.field_value,
          is_mandatory: field.is_mandatory,
        },
      });
    })
  );

  return audienceInDb;
}

// GET List of Audience/Campaign of specific brand - GET
export async function GetAllAudienceOfBrand(brandId: number) {
  const allAudiences = await prisma.audience.findMany({
    where: {
      OR: [{ brand_id: brandId }],
    },
  });

  const audienceData = Promise.all(
    allAudiences.map(async (audience) => {
      const audienceFields = await prisma.audience_fields.findMany({
        where: {
          AND: [{ audience_id: audience.audience_id }],
        },
      });
      const audienceArr: any[] = [];
      audienceFields.forEach((field) => {
        audienceArr.push({
          [field.field_name]: field.field_value,
          mandatory: field.is_mandatory,
        });
      });
      return {
        audience_id: audience.audience_id,
        brand_id: audience.brand_id,
        fields: audienceArr,
      };
    })
  );

  return audienceData;
}

// GET details of specific audience/Campaign - GET/:id
export async function GetAudienceById(audienceId: number) {
  const audience = await prisma.audience.findUnique({
    where: {
      audience_id: audienceId,
    },
  });

  if (!audience) throw new Error("Audience not found for this audience ID");
  const audienceFields = await prisma.audience_fields.findMany({
    where: {
      AND: [{ audience_id: audience.audience_id }],
    },
  });
  const audienceArr: any[] = [];
  let isEditable = true;
  audienceFields.forEach((field) => {
    audienceArr.push({
      [field.field_name]: field.field_value,
      mandatory: field.is_mandatory,
    });
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      AND: [{ audience_id: audience.audience_id }],
    },
  });

  campaigns.forEach((campagin) => {
    if (campagin.status === "OFFER_ACCEPTED") {
      isEditable = false;
    }
  });

  return {
    audience_id: audience.audience_id,
    brand_id: audience.brand_id,
    fields: audienceArr,
    is_editable: isEditable,
  };
}

export async function GetAudienceFieldsInfo() {
  const fieldsMapping = await prisma.fieldMapping.findMany();
  const fieldsCount = {};

  for (const obj of fieldsMapping) {
    const fieldName = obj.field_name;
    for (const prop in obj) {
      if (prop !== "id" && prop !== "field_name") {
        const value = obj[prop as keyof typeof obj];
        if (value !== null) {
          if (fieldsCount[fieldName as keyof typeof fieldsCount]) {
            fieldsCount[fieldName as keyof typeof fieldsCount]++;
          } else {
            //@ts-ignore
            fieldsCount[fieldName] = 1;
          }
        }
      }
    }
  }
  const fieldsCountInfo = [];
  for (const prop in fieldsCount) {
    fieldsCountInfo.push({
      field_name: prop,
      dp_count: fieldsCount[prop as keyof typeof fieldsCount],
    });
  }
  return fieldsCountInfo;
}

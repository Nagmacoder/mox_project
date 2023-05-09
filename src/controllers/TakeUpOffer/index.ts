import { Request, Response } from "express";
import * as fs from "fs";
import prisma from "../../config/db";
import { Logger } from "../../logger";
import { createConnectionProviderDB } from "../../config/clientDbConnection";
import requestRejectTemplate from "../../templates/templateRequestReject";
import MailService from "../../services/Auth/MailService";
const { getPrivateData } = require("./models/privateData");
const { generateProof } = require("./models/proofGenerator");
const { createInput } = require("./controllers/input");

const logger = new Logger();

export async function takeUpOffer(req: Request, res: Response) {
  const {
    sender_brandId,
    sender_campaignId,
    receiver_userId,
    receiver_brandId,
    dp_note,
    dc_note,
  } = req.body;

  const requestStatus = req.query.requestStatus;
  if (!requestStatus) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Please add requestStatus in the query param",
    });
  }
  try {
    switch (requestStatus) {
      case "ACCEPTED":
        const dataProof = await prisma.dataProof.findMany({
          where: {
            AND: [
              {
                sender_brand_id: Number(sender_brandId),
                sender_campaign_id: Number(sender_campaignId),
                receiver_brand_id: Number(receiver_brandId),
              },
            ],
          },
        });
        if (dataProof.length) {
          return res.json({
            status: true,
            proofId: dataProof[0].proof_id,
            message: "Proof already generated for this campaign",
            error: null,
          });
        }

        const receiver = await prisma.userAccount.findUnique({
          where: {
            user_id: receiver_userId,
          },
        });
        if (!receiver) {
          throw new Error("Receiver from this user id not found, Please check");
        }

        const dbInfo = await prisma.clientDBInfo.findUnique({
          where: {
            business_entity_id: receiver.business_entity_id,
          },
        });

        if (!dbInfo) {
          throw new Error("DB not found for this Data Provider");
        }

        logger.debug("Client DB Name" + dbInfo.client_dbname);

        const pool = createConnectionProviderDB({
          user: dbInfo.client_db_username,
          database: dbInfo.client_dbname,
          password: dbInfo.client_db_password,
          port: 5432,
          host: "localhost",
        });

        const senderBrand = await prisma.brand.findUnique({
          where: {
            brand_id: sender_brandId,
          },
        });
        if (!senderBrand) {
          throw new Error("Brand of this user not found");
        }

        const receiverBrand = await prisma.brand.findUnique({
          where: {
            brand_id: receiver_brandId,
          },
        });

        if (!receiverBrand) {
          throw new Error("Brand of receiver not found");
        }

        const campaign = await prisma.campaign.findMany({
          where: {
            AND: [{ brand_id: sender_brandId, campaign_id: sender_campaignId }],
          },
        });
        if (!campaign.length) {
          throw new Error("Campaign of this brand not found");
        }

        const audience_fields = await prisma.audience_fields.findMany({
          where: {
            AND: [{ audience_id: campaign[0].audience_id }],
          },
        });

        let templateFields: any = {};
        audience_fields.forEach((field) => {
          const { field_name, field_value, is_mandatory } = field;
          templateFields[field_name] = {
            value: field_value,
            mandate: is_mandatory,
          };
        });

        const templateData = {
          fields: {
            location: {
              value: templateFields["audience_location"]?.value,
              mandate: templateFields["audience_location"]?.mandate,
            },
            [dbInfo.client_dbname === "velocity" ? "owner_age" : "age"]: {
              value: [
                templateFields["age_range_min"]?.value,
                templateFields["age_range_max"]?.value,
              ],
              mandate: templateFields["age_range_min"]?.mandate,
            },
            [dbInfo.client_dbname === "velocity" ? "owner_gender" : "gender"]: {
              value: templateFields["gender"]?.value,
              mandate: templateFields["gender"]?.mandate,
            },
            language: {
              value: templateFields["languages"]?.value,
              mandate: templateFields["languages"]?.mandate,
            },
            // rc_rto_state: {
            //   value: templateFields["rc_rto_state"]?.value,
            //   mandate: templateFields["rc_rto_state"]?.mandate,
            // },
            // make_year: {
            //   value: templateFields["make_year"]?.value,
            //   mandate: templateFields["make_year"]?.mandate,
            // },
            // fuel_type: {
            //   value: templateFields["fuel_type"]?.value,
            //   mandate: templateFields["fuel_type"]?.mandate,
            // },
            // emission_standard: {
            //   value: templateFields["emission_standard"]?.value,
            //   mandate: templateFields["emission_standard"]?.mandate,
            // },
            // rc_status: {
            //   value: templateFields["rc_status"]?.value,
            //   mandate: templateFields["rc_status"]?.mandate,
            // },
            // rc_expiry_date: {
            //   value: templateFields["rc_expiry_date"]?.value,
            //   mandate: templateFields["rc_expiry_date"]?.mandate,
            // },
            // insurance_expiry_date: {
            //   value: templateFields["insurance_expiry_date"]?.value,
            //   mandate: templateFields["insurance_expiry_date"]?.mandate,
            // },
            // is_commercial: {
            //   value: templateFields["is_commercial"]?.value,
            //   mandate: templateFields["is_commercial"]?.mandate,
            // },
            // is_kyc: {
            //   value: templateFields["is_kyc"]?.value,
            //   mandate: templateFields["is_kyc"]?.mandate,
            // },
            // ownership_status: {
            //   value: templateFields["ownership_status"]?.value,
            //   mandate: templateFields["ownership_status"]?.mandate,
            // },
            // brand: {
            //   value: templateFields["brand"]?.value,
            //   mandate: templateFields["brand"]?.mandate,
            // },
          },
          percentage: templateFields["percentage"]?.value,
        };

        logger.debug(JSON.stringify(templateData));
        const paramsData = {
          count: 1000,
          page: 1,
          template_id: sender_campaignId,
        };
        // console.log("PARAMS DATA ", paramsData);
        const privateData = await getPrivateData(
          templateData,
          paramsData,
          false,
          pool,
          dbInfo.client_dbname
        );
        const pids: any[] = [];
        const modifiedPrivateData = privateData["data"].map((item: any) => {
          pids.push(item.pid);
          const { pid, r, ...rest } = item;
          return rest;
        });
        // console.log("PRIVATE DATA ->", modifiedPrivateData);
        const input = createInput(
          templateData.fields,
          modifiedPrivateData,
          privateData.percentage
        );
        // console.log("Input ->", input);
        saveFile(
          `${__dirname}/privateData_${paramsData["template_id"]}.json`,
          input["privateData"],
          true
        );
        saveFile(
          `${__dirname}/templateData_${paramsData["template_id"]}.json`,
          input["templateData"],
          false
        );
        saveFile(
          `${__dirname}/nonMandateFields_${paramsData["template_id"]}.json`,
          input["nonMandateFields"],
          false
        );
        saveFile(
          `${__dirname}/percentage_${paramsData["template_id"]}.json`,
          input["percentage"],
          false
        );

        logger.info(
          "Write operation for proof generation completed successfully ✅"
        );
        const proof = await generateProof(sender_campaignId, 10);
        if (proof.status == false) {
          return res.send(proof);
        }
        const proofData = {
          nonRequiredNotFound: privateData["mismatchedItems"],
          pids,
          proof,
        };

        const result = await prisma.dataProof.create({
          data: {
            sender_business_entity_id: senderBrand.business_entity_id,
            sender_brand_id: senderBrand.brand_id,
            sender_campaign_id: sender_campaignId,
            receiver_business_entity_id: receiver.business_entity_id,
            receiver_brand_id: receiver_brandId,
            proof: proofData.proof.proof,
            pids: proofData.pids,
            solidity: proofData.proof?.solidity,
            users_count: proofData.pids.length,
          },
        });

        await Promise.all(
          proofData.pids.map(async (pid) => {
            await prisma.userPids.create({
              data: {
                sender_business_entity_id: senderBrand.business_entity_id,
                sender_brand_id: senderBrand.brand_id,
                sender_campaign_id: sender_campaignId,
                receiver_business_entity_id: receiver.business_entity_id,
                receiver_brand_id: receiver_brandId,
                p_id: pid,
              },
            });
          })
        );

        let updateRequest = await prisma.$queryRaw`
      update "mox"."ConnectionRequest" 
      set "isAccepted" = true, "requestStatus"= 'ACCEPTED', "dp_note"=${dp_note}, "dc_note"=${dc_note}
      where "receiver_brandId"=${receiver_brandId} AND "receiver_userId"=${receiver_userId}
      AND "sender_brandId"=${sender_brandId} AND "sender_campaignId"=${sender_campaignId}
    `;

        logger.debug(JSON.stringify(updateRequest));
        const updateCampaign = await prisma.campaign.update({
          where: {
            campaign_id: sender_campaignId,
          },
          data: {
            status: "OFFER_ACCEPTED",
          },
        });

        res.json({
          success: true,
          message: "PIDs relalted to template fetched",
          proof_id: result.proof_id,
          error: null,
        });
        break;

      case "REJECTED":
        await prisma.$queryRaw`
      update "mox"."ConnectionRequest" 
      set "isAccepted" = false, "requestStatus"= 'REJECTED', "dp_note"=${dp_note}, "dc_note"=${dc_note}
      where "receiver_brandId"=${receiver_brandId} AND "receiver_userId"=${receiver_userId}
      AND "sender_brandId"=${sender_brandId} AND "sender_campaignId"=${sender_campaignId}
    `;

        const sender = await prisma.brand.findUnique({
          where: {
            brand_id: sender_brandId,
          },
        });

        if (!sender) {
          throw new Error("Sender from this brand id not found, Please check");
        }
        console.log(sender);

        const senderInfo = await prisma.userAccount.findMany({
          where: {
            AND: [
              {
                business_entity_id: sender.business_entity_id,
              },
            ],
          },
        });

        if (!senderInfo.length) {
          throw new Error("DB not found for this Data Provider");
        }

        const mailTemplate = requestRejectTemplate("Reject");
        const mailService = MailService.getInstance();
        await mailService.sendMail(req.headers["X-Request-Id"], {
          to: senderInfo[0].email,
          subject: "Template Request Reject",
          html: mailTemplate.html,
        });

        res.json({
          success: true,
          message: "Request Rejected Successfully",
          error: null,
        });
        break;

      case "PENDING":
        await prisma.$queryRaw`
    update "mox"."ConnectionRequest" 
    set "isAccepted" = false, "requestStatus"= 'PENDING', "dp_note"=${dp_note}, "dc_note"=${dc_note}
    where "receiver_brandId"=${receiver_brandId} AND "receiver_userId"=${receiver_userId}
    AND "sender_brandId"=${sender_brandId} AND "sender_campaignId"=${sender_campaignId}
  `;

        const senderData = await prisma.brand.findUnique({
          where: {
            brand_id: sender_brandId,
          },
        });

        if (!senderData) {
          throw new Error("Sender from this brand id not found, Please check");
        }

        const sender_Info = await prisma.userAccount.findMany({
          where: {
            AND: [
              {
                business_entity_id: sender.business_entity_id,
              },
            ],
          },
        });

        if (!senderInfo.length) {
          throw new Error("DB not found for this Data Provider");
        }

        const mail_Template = requestRejectTemplate("Pending");
        const mail_Service = MailService.getInstance();
        await mail_Service.sendMail(req.headers["X-Request-Id"], {
          to: sender_Info[0].email,
          subject: "Template Request Pending",
          html: mail_Template.html,
        });

        res.json({
          success: true,
          message: "Request is in pending state",
          error: null,
        });
        break;
    }
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

const saveFile = (filePath: string, input: any, overwriteFile: boolean) => {
  if (fs.existsSync(filePath)) {
    if (overwriteFile) {
      // If the file exists, read its contents and parse the JSON data
      const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // Merge the existing data with the new data
      const mergedData = [...existingData, ...input];

      // Write the merged data to the file
      fs.writeFileSync(filePath, JSON.stringify(mergedData), "utf-8");
    }
  } else {
    // If the file does not exist, write the new data to a new file
    fs.writeFileSync(filePath, JSON.stringify(input), "utf-8");
  }
};

export async function GetProofById(req: Request, res: Response) {
  const proofId = Number(req.params.proofId);
  try {
    const proof = await prisma.dataProof.findUnique({
      where: {
        proof_id: proofId,
      },
    });

    const proofRes = {
      proof_id: proof.proof_id,
      sender_business_entity_id: proof.sender_business_entity_id,
      sender_brand_id: proof.sender_brand_id,
      sender_campaign_id: proof.sender_campaign_id,
      receiver_business_entity_id: proof.receiver_business_entity_id,
      receiver_brand_id: proof.receiver_brand_id,
      proof: proof.proof,
      solidity: proof.solidity,
      isVerified: proof.isVerified,
      contractAddress: proof.contractAddress,
      users_count: proof.users_count,
    };

    res.json({ success: true, data: proofRes, error: null });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

export async function GetUsersCount(req: Request, res: Response) {
  const {
    sender_brandId,
    sender_campaignId,
    receiver_userId,
    receiver_brandId,
  } = req.body;
  try {
    const dataProof = await prisma.dataProof.findMany({
      where: {
        AND: [
          {
            sender_brand_id: Number(sender_brandId),
            sender_campaign_id: Number(sender_campaignId),
            receiver_brand_id: Number(receiver_brandId),
          },
        ],
      },
    });
    if (dataProof.length) {
      const pids = dataProof[0].pids;
      //@ts-ignore
      const numOfUsers = pids.length;
      return res.json({ success: true, usersCount: numOfUsers, error: null });
    }

    const receiver = await prisma.userAccount.findUnique({
      where: {
        user_id: receiver_userId,
      },
    });
    if (!receiver) {
      throw new Error("Receiver from this user id not found, Please check");
    }

    const dbInfo = await prisma.clientDBInfo.findUnique({
      where: {
        business_entity_id: receiver.business_entity_id,
      },
    });

    logger.debug("Client DB Name " + dbInfo.client_dbname);

    const pool = createConnectionProviderDB({
      user: dbInfo.client_db_username,
      database: dbInfo.client_dbname,
      password: dbInfo.client_db_password,
      port: 5432,
      host: "localhost",
    });

    if (!dbInfo) {
      throw new Error("DB not found for this Data Provider");
    }

    const senderBrand = await prisma.brand.findUnique({
      where: {
        brand_id: sender_brandId,
      },
    });
    if (!senderBrand) {
      throw new Error("Brand of this user not found");
    }

    const receiverBrand = await prisma.brand.findUnique({
      where: {
        brand_id: receiver_brandId,
      },
    });

    if (!receiverBrand) {
      throw new Error("Brand of receiver not found");
    }

    const campaign = await prisma.campaign.findMany({
      where: {
        AND: [{ brand_id: sender_brandId, campaign_id: sender_campaignId }],
      },
    });
    if (!campaign.length) {
      throw new Error("Campaign of this brand not found");
    }

    const audience = await prisma.audience.findUnique({
      where: {
        audience_id: campaign[0].audience_id,
      },
    });

    const audience_fields = await prisma.audience_fields.findMany({
      where: {
        AND: [{ audience_id: campaign[0].audience_id }],
      },
    });

    let templateFields: any = {};
    audience_fields.forEach((field) => {
      const { field_name, field_value, is_mandatory } = field;
      templateFields[field_name] = {
        value: field_value,
        mandate: is_mandatory,
      };
    });
    if (
      templateFields["age_range_min"].value == undefined ||
      templateFields["age_range_min"].value == ""
    ) {
      templateFields["age_range_min"] = "0";
    }
    if (
      templateFields["age_range_max"].value == undefined ||
      templateFields["age_range_max"].value == ""
    ) {
      templateFields["age_range_max"] = "100";
    }
    console.log(templateFields);
    const templateData = {
      fields: {
        location: {
          value: templateFields["audience_location"]?.value,
          mandate: templateFields["audience_location"]?.mandate,
        },
        [dbInfo.client_dbname === "velocity" ? "owner_age" : "age"]: {
          value: [
            templateFields["age_range_min"]?.value,
            templateFields["age_range_max"]?.value,
          ],
          mandate: templateFields["age_range_min"]?.mandate,
        },
        [dbInfo.client_dbname === "velocity" ? "owner_gender" : "gender"]: {
          value: templateFields["gender"]?.value,
          mandate: templateFields["gender"]?.mandate,
        },
        language: {
          value: templateFields["languages"]?.value,
          mandate: templateFields["languages"]?.mandate,
        },
        // rc_rto_state: {
        //   value: templateFields["rc_rto_state"]?.value,
        //   mandate: templateFields["rc_rto_state"]?.mandate,
        // },
        // make_year: {
        //   value: templateFields["make_year"]?.value,
        //   mandate: templateFields["make_year"]?.mandate,
        // },
        // fuel_type: {
        //   value: templateFields["fuel_type"]?.value,
        //   mandate: templateFields["fuel_type"]?.mandate,
        // },
        // emission_standard: {
        //   value: templateFields["emission_standard"]?.value,
        //   mandate: templateFields["emission_standard"]?.mandate,
        // },
        // rc_status: {
        //   value: templateFields["rc_status"]?.value,
        //   mandate: templateFields["rc_status"]?.mandate,
        // },
        // rc_expiry_date: {
        //   value: templateFields["rc_expiry_date"]?.value,
        //   mandate: templateFields["rc_expiry_date"]?.mandate,
        // },
        // insurance_expiry_date: {
        //   value: templateFields["insurance_expiry_date"]?.value,
        //   mandate: templateFields["insurance_expiry_date"]?.mandate,
        // },
        // is_commercial: {
        //   value: templateFields["is_commercial"]?.value,
        //   mandate: templateFields["is_commercial"]?.mandate,
        // },
        // is_kyc: {
        //   value: templateFields["is_kyc"]?.value,
        //   mandate: templateFields["is_kyc"]?.mandate,
        // },
        // ownership_status: {
        //   value: templateFields["ownership_status"]?.value,
        //   mandate: templateFields["ownership_status"]?.mandate,
        // },
        // brand: {
        //   value: templateFields["brand"]?.value,
        //   mandate: templateFields["brand"]?.mandate,
        // },
      },
      percentage: templateFields["percentage"]?.value,
    };

    logger.debug(JSON.stringify(templateData));

    const privateData = await getPrivateData(
      templateData,
      null,
      true,
      pool,
      dbInfo.client_dbname
    );

    res.json({
      success: true,
      usersCount: privateData["data"][0]["count"],
      error: null,
    });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

export async function GetDistinctUsers(req: Request, res: Response) {
  const { sender_userId, sender_brandId, sender_campaignId } = req.body;
  try {
    const sender = await prisma.userAccount.findUnique({
      where: {
        user_id: sender_userId,
      },
    });
    if (!sender) {
      throw new Error("Sender not found for this ID");
    }
    const senderBrand = await prisma.brand.findUnique({
      where: {
        brand_id: sender_brandId,
      },
    });
    if (!senderBrand) {
      throw new Error("Brand of this user not found");
    }

    const pids = await prisma.$queryRaw`
      select "p_id" from "mox"."UserPids" where sender_business_entity_id = ${sender.business_entity_id} and 
      sender_brand_id = ${sender_brandId} and sender_campaign_id = ${sender_campaignId}
      group by "p_id" having count("p_id")>1;
    `;
    //@ts-ignore
    const pidsCount = pids.length;
    res.json({ success: true, userCount: pidsCount, error: null });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

export async function AcceptedCampaignLists(req: Request, res: Response) {
  const { provider_brandId, provider_userId } = req.body;

  try {
    const provider = await prisma.userAccount.findUnique({
      where: {
        user_id: Number(provider_userId),
      },
    });

    const dataProof = await prisma.dataProof.findMany({
      where: {
        AND: [
          {
            receiver_brand_id: Number(provider_brandId),
            receiver_business_entity_id: provider.business_entity_id,
          },
        ],
      },
    });

    const acceptedCampaigns = await Promise.all(
      dataProof.map(async (proof) => {
        const campaign = await prisma.campaign.findUnique({
          where: {
            campaign_id: proof.sender_campaign_id,
          },
        });
        const brand = await prisma.brand.findUnique({
          where: {
            brand_id: proof.sender_brand_id,
          },
        });
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
          campaign_id: campaign.campaign_id,
          brand_id: campaign.brand_id,
          brand_info: { name: brand.brand_name, logo: brand.logo },
          preview_image: campaign.preview_image,
          status: campaign.status,
          audience_id: campaign.audience_id,
          fields: campaignArr,
        };
      })
    );

    return res.json({ success: true, data: acceptedCampaigns, error: null });
  } catch (err) {
    return res.json({ success: false, data: null, error: err.message });
  }
}

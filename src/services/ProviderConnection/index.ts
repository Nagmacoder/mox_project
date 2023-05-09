import prisma from "../../config/db";
import { Logger } from "../../logger";

const logger = new Logger();

export async function getAllDP(bodyParams: any) {
  const { sender_userId, sender_brandId, sender_campaignId } = bodyParams;
  // const campaign = await prisma.campaign.findUnique({
  //   where: {
  //     campaign_id: sender_campaignId,
  //   },
  // });
  // const audience_fields = await prisma.audience_fields.findMany({
  //   where: {
  //     AND: [{ audience_id: campaign.audience_id }],
  //   },
  // });
  // let non_mandate = 0;
  // let fieldMapping: any[] = [];
  // await Promise.all(
  //   audience_fields.map(async (field) => {
  //     const { field_name, field_value, is_mandatory } = field;
  //     if (!is_mandatory) non_mandate++;

  //     const mappingField: any[] = await prisma.$queryRaw`
  //    select * from "mox"."FieldMapping" where field_name=${field_name}
  //   `;
  //     if (mappingField.length) {
  //       fieldMapping.push({
  //         field_name,
  //         field_value,
  //         is_mandatory,
  //         ...mappingField[0],
  //       });
  //     }
  //   })
  // );
  // console.log(fieldMapping);
  const users = await prisma.userAccount.findMany();
  let totalUsers = 0;
  let DP = await Promise.all(
    users.map(async (user) => {
      const [result1, result2, result3] = await Promise.all([
        getBrandIdsForUser(user.business_entity_id),
        isUserRequested(
          user.user_id,
          sender_userId,
          sender_brandId,
          sender_campaignId
        ),
        getProofIdForDP(
          user.business_entity_id,
          sender_brandId,
          sender_campaignId,
          sender_userId
        ),
      ]);
      if (result3.isApproved) {
        totalUsers = totalUsers + result3.usersCount;
      }
      if (result1) {
        return {
          user_id: user.user_id,
          p_id: user.p_id,
          email: user.email,
          business_entity_id: user.business_entity_id,
          brands: result1,
          isRequested: result2.isRequested,
          requestStatus: result2.requestStatus,
          note: result2.note,
          proof: result3,
        };
      }
    })
  );
  const filteredDp = DP.filter((prov) => prov?.user_id !== sender_userId);
  return { DP: filteredDp, totalUsers };
}

async function getProofIdForDP(
  receieverBusinessId: number,
  senderBrand: number,
  senderCampaign: number,
  senderUserId: number
) {
  const proof = await prisma.dataProof.findMany({
    where: {
      AND: [
        {
          sender_brand_id: senderBrand,
          sender_campaign_id: senderCampaign,
          receiver_business_entity_id: receieverBusinessId,
        },
      ],
    },
  });

  if (proof.length) {
    return {
      proofId: proof[0].proof_id,
      usersCount: proof[0].users_count,
      isApproved: true,
      is_proof_verified: proof[0].isVerified,
    };
  }
  // @ts-ignore
  return { proofId: null, isApproved: false, is_proof_verified: false };
}

async function getBrandIdsForUser(businessId: number) {
  const clientDb = await prisma.clientDBInfo.findMany({
    where: {
      AND: [{ business_entity_id: businessId }],
    },
  });

  if (clientDb.length) {
    const brands = await prisma.brand.findMany({
      where: {
        OR: [{ business_entity_id: businessId }],
      },
    });
    const brandData = brands.map((brand) => {
      return {
        brandId: brand.brand_id,
        name: brand.brand_name,
        logo: brand.logo,
        category: JSON.parse(brand.site_category),
        mau: brand.mau,
        //@ts-ignore
        languages: JSON.parse(brand.languages),
        //@ts-ignore
        locations: JSON.parse(brand.audience_location),
      };
    });
    return brandData;
  }
}

async function isUserRequested(
  receiverUserId: number,
  senderUserId: number,
  senderBrand: number,
  senderCampaign: number
) {
  let isRequested = false;
  const request = await prisma.connectionRequest.findMany({
    where: {
      AND: [
        {
          receiver_userId: receiverUserId,
          sender_userId: senderUserId,
          sender_brandId: senderBrand,
          sender_campaignId: senderCampaign,
        },
      ],
    },
  });
  if (request.length) {
    isRequested = true;
  }

  return {
    isRequested,
    requestStatus: request[0]?.requestStatus,
    note: request[0]?.dp_note,
  };
}

export async function sendConnectionRequest(requestParams: any) {
  const {
    sender_userId,
    sender_brandId,
    sender_campaignId,
    receiver_userId,
    receiver_brandId,
  } = requestParams;

  const requestList = await prisma.connectionRequest.findMany({
    where: {
      AND: [{ sender_brandId, receiver_brandId, sender_campaignId }],
    },
  });

  if (requestList.length) {
    throw new Error(
      "Request with this sender and receiver already there, Cannot send again"
    );
  }

  const sender = await prisma.userAccount.findUnique({
    where: {
      user_id: sender_userId,
    },
  });

  const senderBrand = await prisma.brand.findMany({
    where: {
      AND: [
        {
          brand_id: sender_brandId,
          business_entity_id: sender.business_entity_id,
        },
      ],
    },
  });

  if (!senderBrand.length) throw new Error("Brand of this sender not found");

  const senderCampaign = await prisma.campaign.findUnique({
    where: {
      campaign_id: Number(sender_campaignId),
    },
  });

  if (!senderCampaign) throw new Error("Campaign of this brand not found");

  const receiver = await prisma.userAccount.findUnique({
    where: {
      user_id: receiver_userId,
    },
  });

  const receiverBrand = await prisma.brand.findMany({
    where: {
      AND: [
        {
          brand_id: receiver_brandId,
          business_entity_id: receiver.business_entity_id,
        },
      ],
    },
  });

  if (!receiverBrand.length)
    throw new Error("Brand of this receiver not found");

  const data = await prisma.connectionRequest.create({
    data: {
      sender_userId,
      receiver_userId,
      sender_brandId,
      receiver_brandId,
      sender_campaignId,
    },
  });

  const updateCampaign = await prisma.campaign.update({
    where: {
      campaign_id: sender_campaignId,
    },
    data: {
      status: "REQUESTED",
    },
  });

  return { data, updateCampaign };
}

export async function showCampaignRequestsDP(
  brandId: number,
  requestStatus: string
) {
  const requests = await prisma.connectionRequest.findMany({
    where: {
      AND: [{ receiver_brandId: brandId }],
    },
  });

  if (!requests.length) throw new Error("No Requests found for this brand ID");

  const requestData = await Promise.all(
    requests.map(async (request) => {
      const campaignInDb = await prisma.campaign.findUnique({
        where: {
          campaign_id: request.sender_campaignId,
        },
      });

      const fields = await prisma.campaign_fields.findMany({
        where: { AND: [{ campaign_id: request.sender_campaignId }] },
      });

      const brand = await prisma.brand.findUnique({
        where: {
          brand_id: request.sender_brandId,
        },
      });
      let fieldsArr: any[] = [];
      fields.forEach((field) =>
        fieldsArr.push({ [field.field_name]: field.field_value })
      );
      return {
        request_id: request.request_id,
        sender_brandId: request.sender_brandId,
        brand_info: { name: brand.brand_name, logo: brand.logo },
        sender_userId: request.sender_userId,
        sender_campaignId: request.sender_campaignId,
        preview_image: campaignInDb.preview_image,
        receiver_brandId: request.receiver_brandId,
        receiver_userId: request.receiver_userId,
        isAccepted: request.isAccepted,
        requestStatus: request.requestStatus,
        campaign_fields: fieldsArr,
        created_at: request.created_at,
      };
    })
  );

  let filteredRequests = [];
  switch (requestStatus) {
    case "ACCEPTED":
      filteredRequests = requestData.filter(
        (request) => requestStatus === request.requestStatus
      );
      break;

    case "REJECTED":
      filteredRequests = requestData.filter(
        (request) => requestStatus === request.requestStatus
      );
      break;

    case "REQUESTED":
      filteredRequests = requestData.filter(
        (request) => requestStatus === request.requestStatus
      );
      break;

    case "PENDING":
      filteredRequests = requestData.filter(
        (request) => requestStatus === request.requestStatus
      );
      break;
    default:
      filteredRequests = requestData;
  }

  const sortedRequests = filteredRequests.sort(
    // @ts-ignore
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return sortedRequests;
}

export async function ViewConnection(brandId: number) {
  const brand = await prisma.brand.findUnique({
    where: {
      brand_id: brandId,
    },
  });

  if (!brand) {
    throw new Error("No brand found with this brand ID");
  }

  const audiences = await prisma.audience.findMany({
    where: {
      AND: [{ brand_id: brand.brand_id }],
    },
  });

  const audienceData = await Promise.all(
    audiences.map(async (audience) => {
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
        fields: audienceArr,
      };
    })
  );

  return { brand, audience_profiles: audienceData };
}

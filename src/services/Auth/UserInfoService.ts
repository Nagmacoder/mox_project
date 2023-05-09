import prisma from "../../config/db";

export async function UserInfoService(userId: number) {
  const userInfo = await prisma.userAccount.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      email: true,
      account_status: true,
      user_id: true,
      role_name: true,
      business_entity: {
        select: {
          business_entity_id: true,
          given_name: true,
          family_name: true,
          display_name: true,
          business_entity_type: {
            select: {
              business_entity_type_name: true,
            },
          },
        },
      },
    },
  });

  if (!userInfo) throw new Error("User not found with this User Id");

  const businessEntityId = userInfo.business_entity.business_entity_id;

  const brand = await prisma.brand.findFirst({
    where: {
      business_entity_id: businessEntityId,
    },
    select: {
      brand_name: true,
      brand_id: true,
      logo: true,
    },
  });

  const brandInfo: BrandInfo = {
    business_entity_id: businessEntityId,
    business_entity_type_name: userInfo.business_entity.business_entity_type.business_entity_type_name,
    brand_name: brand.brand_name,
    brand_logo: brand.logo,
    brand_id: brand.brand_id,
  };

  const userDetails = {
    given_name: userInfo.business_entity.given_name,
    family_name: userInfo.business_entity.family_name,
    display_name: userInfo.business_entity.display_name,
    email: userInfo.email,
    account_status: userInfo.account_status,
    user_id: userInfo.user_id,
    role_name: userInfo.role_name,
  };

  return { user: userDetails, brand: brandInfo };
}

export async function UnVerifiedUsersInfoService() {
  const users = await prisma.userAccount.findMany({
    where: {
      AND: [{ is_email_verified: true }, { account_status: 0 }],
      NOT: { role_name: "SUPER_ADMIN" },
    },
    select: {
      email: true,
      user_id: true,
      role_name: true,
      account_status: true,
      business_entity: {
        select: {
          business_entity_id: true,
          given_name: true,
          family_name: true,
          display_name: true,
        },
      },
    },
  });

  if (!users.length) throw new Error("No user found.");

  const usersInfo = users.map((user) => ({
    user_id: user.user_id,
    role_name: user.role_name,
    account_status: user.account_status,
    given_name: user.business_entity.given_name,
    family_name: user.business_entity.family_name,
    email: user.email,
    display_name: user.business_entity.display_name,
  }));

  return usersInfo;
}

export async function UserAccountActionService(
  email: string,
  userId: string,
  accountStatus: number
) {
  const user_id = parseInt(userId);
  const user = await prisma.userAccount.findMany({
    where: {
      AND: [{ email: email }, { user_id: user_id }],
    },
    select: { role_name: true },
  });

  if (!user.length) throw new Error("Incorrect email or userId.");

  const updatedUserInfo = await prisma.userAccount.update({
    where: { user_id: user_id },
    data: {
      account_status: accountStatus,
    },
  });

  return updatedUserInfo;
}

const accountStatusMap: any = {
  0: "UNVERIFIED",
  1: "VERIFIED",
  2: "BLOCKED",
  3: "REJECTED",
};

interface UserInfo {
  given_name: string;
  family_name: string;
  brand_user_role: string;
  account_status: number;
  user_id: number;
}

interface BrandInfo {
  business_entity_id: number;
  business_entity_type_name: string;
  brand_name: string;
  brand_logo: string;
  brand_id: number;
}

interface UserInfoByBrandId {
  users: UserInfo[];
  brand: BrandInfo;
}

export async function GetUserInfoByBrandIdService(
  brand_id: number
): Promise<UserInfoByBrandId> {
  const brand = await prisma.brand.findUnique({
    where: {
      brand_id: brand_id,
    },
    select: {
      brand_name: true,
      logo: true,
      brand_id: true,
      business_entity_id: true,
      business_entity: {
        select: {
          business_entity_type: {
            select: {
              business_entity_type_name: true,
            },
          },
        },
      },
    },
  });

  if (!brand) throw new Error("No brand associated with brand id: " + brand_id);

  const entity_id = brand.business_entity_id;

  const users = await prisma.userAccount.findMany({
    where: {
      AND: [{ business_entity_id: entity_id }],
    },
    select: {
      email: true,
      account_status: true,
      user_id: true,
      business_entity: {
        select: {
          business_entity_id: true,
          given_name: true,
          family_name: true,
        },
      },
    },
  });

  const userInfos = users.map((u) => ({
    given_name: u.business_entity.given_name,
    family_name: u.business_entity.family_name,
    email: u.email,
    brand_user_role: "Administrator",
    account_status: u.account_status,
    user_id: u.user_id,
  }));

  const brandInfo: BrandInfo = {
    business_entity_id: brand.business_entity_id,
    business_entity_type_name:
      brand.business_entity.business_entity_type.business_entity_type_name,
    brand_name: brand.brand_name,
    brand_logo: brand.logo,
    brand_id: brand.brand_id,
  };

  return {
    users: userInfos,
    brand: brandInfo,
  };
}

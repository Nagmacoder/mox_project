export interface IUser {
  user_id: number;
  email: string;
  password_hash: string;
  password_salt: string;
  business_entity_id: number;
  login_as: number;
  is_active: boolean;
  is_email_verified: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ISignup {
  given_name: string;
  family_name: string;
  email: string;
  display_name: string;
  password: string;
}

export interface MailInterface {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
}
export interface ICreateBrand {
  businessEntityId: number;
  brand_name: string;
  logo?: string;
  about?: string;
  online_store?: string;
  website: string;
  mau?: string;
  site_category?: string;
  audience_location?: { [key: string]: string };
  languages?: { [key: string]: string };
  social_media_handles?: { [key: string]: string };
}

interface IAdudienceFields {
  [key: string]: { value: string; mandatory: boolean };
}

export interface ICampaignFields {
  [key: string]: { value: string };
}
export interface ICreateAudience {
  brandId: number;
  fields: IAdudienceFields[];
}

export interface ICreateCampaign {
  brand_id: number;
  audience_id: number;
  previewImage: string;
  fields: ICampaignFields[];
}

export interface ICampaignCreative {
  campaign_id: Number;
  banner_type: string;
  size?: string;
  format?: string;
  urls?: string[];
}

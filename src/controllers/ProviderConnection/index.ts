import { Request, Response } from "express";
import prisma from "../../config/db";
import { Logger } from "../../logger";
import {
  showCampaignRequestsDP,
  sendConnectionRequest,
  getAllDP,
  ViewConnection,
} from "../../services/ProviderConnection";

const logger = new Logger();

// TODO - Will refactor this, Have to transfer these into services
export async function GetAllDPCtrl(req: Request, res: Response) {
  const { sender_userId, sender_brandId, sender_campaignId } = req.body;
  try {
    const { DP, totalUsers } = await getAllDP({
      sender_userId,
      sender_brandId,
      sender_campaignId,
    });
    return res.json({ success: true, error: null, data: DP, totalUsers });
  } catch (err) {
    return res.json({ success: false, error: err.message, data: null });
  }
}

export async function SendConnectionRequestCtrl(req: Request, res: Response) {
  try {
    const {
      sender_userId,
      sender_brandId,
      sender_campaignId,
      receiver_userId,
      receiver_brandId,
    } = req.body;

    const sendRequest = sendConnectionRequest({
      sender_userId,
      sender_brandId,
      sender_campaignId,
      receiver_userId,
      receiver_brandId,
    });

    return res.json({
      success: true,
      error: null,
      message: "Request Sent Successfully",
    });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function showAllRequests(req: Request, res: Response) {
  try {
    const requests = await prisma.connectionRequest.findMany();
    return res.json({ success: true, data: requests, error: null });
  } catch (err) {
    res.json({ success: false, error: err.message, data: null });
  }
}

export async function ShowCampaignRequestsDPCtrl(req: Request, res: Response) {
  try {
    const brandId = Number(req.query.brandId);
    const requestStatus = req.query.requestStatus;
    if (!brandId)
      return res
        .status(400)
        .json({ success: false, data: null, error: "BrandId not found" });

    const requestData = await showCampaignRequestsDP(
      brandId,
      requestStatus as string
    );
    return res.json({ success: true, data: requestData, error: null });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

export async function ViewConnectionCtrl(req: Request, res: Response) {
  const brandId = Number(req.query.brandId);
  if (!brandId)
    return res
      .status(400)
      .json({ success: false, data: null, error: "BrandId not found" });
  try {
    const connectionData = await ViewConnection(brandId);
    return res.json({ success: true, data: connectionData, error: null });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

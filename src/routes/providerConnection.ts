import { Router } from "express";
import * as passport from "passport";
import {
  GetAllDPCtrl,
  SendConnectionRequestCtrl,
  showAllRequests,
  ShowCampaignRequestsDPCtrl,
  ViewConnectionCtrl,
} from "../controllers/ProviderConnection";
import {
  takeUpOffer,
  GetProofById,
  GetUsersCount,
  GetDistinctUsers,
  AcceptedCampaignLists,
} from "../controllers/TakeUpOffer";
import { VerifyProof } from "../controllers/VerifyProof";

const router = Router();
router.post(
  "/user/getAllDataProviders",
  passport.authenticate("jwt", { session: false }),
  GetAllDPCtrl
);

router.post(
  "/user/sendConnectionRequest",
  passport.authenticate("jwt", { session: false }),
  SendConnectionRequestCtrl
);

router.get(
  "/user/showCampaignRequestsDP",
  passport.authenticate("jwt", { session: false }),
  ShowCampaignRequestsDPCtrl
);

router.get(
  "/user/showAllRequests",
  passport.authenticate("jwt", { session: false }),
  showAllRequests
);

router.get(
  "/user/viewConnection",
  passport.authenticate("jwt", { session: false }),
  ViewConnectionCtrl
);

router.post(
  "/user/takeUpOffer",
  passport.authenticate("jwt", { session: false }),
  takeUpOffer
);

router.get(
  "/user/getProofById/:proofId",
  passport.authenticate("jwt", { session: false }),
  GetProofById
);

router.post(
  "/user/getUsersCount",
  passport.authenticate("jwt", { session: false }),
  GetUsersCount
);

router.post(
  "/user/getDistictUserCount",
  passport.authenticate("jwt", { session: false }),
  GetDistinctUsers
);

router.post(
  "/user/verifyProof",
  passport.authenticate("jwt", { session: false }),
  VerifyProof
);

router.post(
  "/user/acceptedCampaigns",
  passport.authenticate("jwt", { session: false }),
  AcceptedCampaignLists
);

export default router;

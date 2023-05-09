import { Request, Response } from "express";
import prisma from "../../config/db";

const ContractController = require("./controller/ContractController");
const ContractModel = require("./model/ContractModel");

export async function VerifyProof(req: Request, res: Response) {
  const proofId = req.body.proofId;
  const contractController = new ContractController(new ContractModel());
  try {
    const proof = await prisma.dataProof.findUnique({
      where: {
        proof_id: Number(proofId),
      },
    });
    if (proof.isVerified) {
      return res.json({
        success: true,
        contract: proof.contractAddress,
        message: "Proof already verified",
      });
    }
    const result = await contractController.deploySmartContract(proofId);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    res.json({ success: false, data: null, error: err.message });
  }
}

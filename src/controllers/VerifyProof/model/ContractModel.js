const { Client } = require("pg");
require("dotenv").config();
import prisma from "../../../config/db";

class ContractModel {
  constructor() {
    // this.client = new Client({
    //   user: process.env.USER,
    //   host: process.env.HOST,
    //   database: process.env.DATABASE,
    //   password: process.env.PASSWORD,
    //   port: process.env.DB_PORT,
    // });
  }

  // async connect() {
  //   await this.client.connect();
  // }

  async getSmartContract(proofID) {
    const contractFile = await prisma.dataProof.findUnique({
      where: {
        proof_id: Number(proofID),
      },
    });
    // const contractFile = await this.client.query(
    //   `SELECT solidity FROM ${process.env.TABLE_NAME} WHERE proof_id = ${proofID}`
    // );
    const contractFileBuffer = Buffer.from(contractFile.solidity, "base64");
    return contractFileBuffer.toString("utf8");
  }

  async getProof(proofID) {
    const contractFile = await prisma.dataProof.findUnique({
      where: {
        proof_id: Number(proofID),
      },
    });
    const proofJson = contractFile.proof;
    const abc = [];
    const processedInput = [];
    abc.push(proofJson.proof.a);
    abc.push(proofJson.proof.b);
    abc.push(proofJson.proof.c);

    processedInput.push(abc);
    processedInput.push(proofJson.inputs);

    return processedInput;
  }

  // async close() {
  //   await this.client.end();
  // }
}

module.exports = ContractModel;

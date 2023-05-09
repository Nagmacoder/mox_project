const TruffleHDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const solc = require("solc");
require("dotenv").config();
import prisma from "../../../config/db";

class ContractController {
  constructor(model) {
    this.model = model;
    this.provider = new TruffleHDWalletProvider(
      process.env.MNEMONIC,
      process.env.INFURA_URL
    );
    this.web3 = new Web3(this.provider);
  }

  async deploySmartContract(proofID) {
    // this.model.connect();
    const decodedFile = await this.model.getSmartContract(proofID);
    const solcInput = {
      language: "Solidity",
      sources: {
        "verifier.sol": {
          content: decodedFile,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    var output = JSON.parse(solc.compile(JSON.stringify(solcInput)));

    const bytecode =
      output.contracts["verifier.sol"].Verifier.evm.bytecode.object;
    const abi = output.contracts["verifier.sol"].Verifier.abi;

    const input = await this.model.getProof(proofID);

    const contract = await new this.web3.eth.Contract(abi);
    // try{
    //   this.verifySmartContract("0x35c8a1991fE34253F7D69c765F77D3F7f0EdBbf3", decodedFile);
    // }catch(err){
    //   console.log(err);
    // }
    // process.exit();

    const chainId = await this.web3.eth.net.getId();

    const deploy = contract.deploy({ data: bytecode });

    const gasPrice = await this.web3.eth.getGasPrice();
    const gasLimit = await deploy.estimateGas();

    const account = await this.web3.eth.getAccounts();

    const { _address } = await deploy.send({
      from: account[0],
      gas: gasLimit,
      chainId,
    });

    contract.options.address = _address;
    const verified = await contract.methods.verifyTx(input[0], input[1]).call();

    if (verified) {
      const updatedData = await prisma.dataProof.updateMany({
        where: {
          proof_id: Number(proofID),
        },
        data: {
          isVerified: true,
          contractAddress: _address,
        },
      });

      return { status: "Verified", contract: _address };
    } else {
      return { status: "Not Verified", contract: _address };
    }

    // this.model.close();
  }

  verifySmartContract(contractAddress, sourceCode) {
    //Submit Source Code for Verification
  }
}

module.exports = ContractController;

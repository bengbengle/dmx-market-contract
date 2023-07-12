import { ethers } from "ethers";
import fs from "fs";
import path from "path";

import type { BigNumber, BigNumberish, Contract } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { OrderStruct } from "../typechain-types/contracts/DMXExchange";

const _path = path.join(__dirname, "../../artifacts/contracts/DMXExchange.sol/DMXExchange.json");
const artifact = JSON.parse(fs.readFileSync(_path, "utf8"));

export const SEAPORT_VALIDATOR_ABI = artifact.abi;
export const SEAPORT_VALIDATOR_ADDRESS = "0xF75194740067D6E4000000003b350688DD770000";

export class Exchange {

  private seaportValidator: Contract;

  public constructor(provider: JsonRpcProvider) {
    if (!provider) {
      throw new Error("No provider provided");
    }

    this.seaportValidator = new ethers.Contract(
      SEAPORT_VALIDATOR_ADDRESS,
      SEAPORT_VALIDATOR_ABI,
      provider
    );
  }

  public async isValidOrder(order: OrderStruct) {
    // return processErrorsAndWarnings(
    //   await this.seaportValidator.isValidOrder(order)
    // );
  }
}

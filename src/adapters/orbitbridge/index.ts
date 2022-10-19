import { BridgeAdapter, PartialContractEventParams } from "../../helpers/bridgeAdapter.type";
import { Chain } from "@defillama/sdk/build/general";
import { getEVMEventLogs } from "../../helpers/eventLogs";
import { constructTransferParams } from "../../helpers/eventParams";

/*

*/

const contractAddresses = {
  ethereum: {
    contract: "0x1Bf68A9d1EaEe7826b3593C20a0ca93293cb489a",
    nativeToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  },
  polygon: {
    contract: "",
    nativeToken: "", // WMATIC
  },
  fantom: {
    contract: "",
    nativeToken: "", // WFTM
  },
  avax: {
    contract: "",
    nativeToken: "", // WAVAX
  },
  bsc: {
    contract: "",
    nativeToken: "", // WBNB
  },
} as {
  [chain: string]: {
    contract: string;
    nativeToken: string;
  };
};

// using this only to filter for ETH txs, because it is unusable for everything else:
// emits repeated events with differing amounts, atomic txs do not emit events, some token addresses withdrawn are not actual token sent (e.g. DAI).
const ethDepositParams: PartialContractEventParams = {
  target: "",
  topic: "Deposit(string,address,bytes,address,uint8,uint256,uint256,bytes)",
  abi: [
    "event Deposit(string toChain, address fromAddr, bytes toAddr, address token, uint8 decimal, uint256 amount, uint256 depositId, bytes data)",
  ],
  logKeys: {
    blockNumber: "blockNumber",
    txHash: "transactionHash",
  },
  argKeys: {
    from: "fromAddr",
    token: "token",
    amount: "amount",
  },
  fixedEventData: {
    to: "",
  },
  isDeposit: true,
  mapTokens: {
    "0x0000000000000000000000000000000000000000": "",
  },
  filter: {
    includeToken: [""],
  },
};

const ethWithdrawalParams: PartialContractEventParams = {
  target: "",
  topic: "Withdraw(string,bytes,bytes,bytes,bytes32[],uint256[],bytes)",
  abi: [
    "event Withdraw(string fromChain, bytes fromAddr, bytes toAddr, bytes token, bytes32[] bytes32s, uint256[] uints, bytes data)",
  ],
  logKeys: {
    blockNumber: "blockNumber",
    txHash: "transactionHash",
  },
  argKeys: {
    token: "token",
    amount: "uints",
    to: "toAddr",
  },
  selectIndexesFromArrays: {
    amount: "0",
  },
  fixedEventData: {
    from: "",
  },
  mapTokens: {
    "0x0000000000000000000000000000000000000000": "",
  },
  filter: {
    includeToken: [""],
  },
  isDeposit: false,
};

const constructParams = (chain: string) => {
  let eventParams = [] as any;
  const chainAddress = contractAddresses[chain].contract;
  const nativeToken = contractAddresses[chain].nativeToken;
  const finalEthDepositParams = {
    ...ethDepositParams,
    target: chainAddress,
    fixedEventData: {
      to: chainAddress,
    },
    mapTokens: {
      "0x0000000000000000000000000000000000000000": nativeToken,
    },
    filter: {
      includeToken: [nativeToken],
    },
  };
  const ercDepositParams = constructTransferParams(chainAddress, true);
  const finalEthWithdrawalParams = {
    ...ethWithdrawalParams,
    target: chainAddress,
    fixedEventData: {
      from: chainAddress,
    },
    mapTokens: {
      "0x0000000000000000000000000000000000000000": nativeToken,
    },
    filter: {
      includeToken: [nativeToken],
    },
  };
  const ercWithdrawalParams = constructTransferParams(chainAddress, false);
  eventParams.push(finalEthDepositParams, finalEthWithdrawalParams, ercDepositParams, ercWithdrawalParams);
  return async (fromBlock: number, toBlock: number) =>
    getEVMEventLogs("orbitbridge", chain as Chain, fromBlock, toBlock, eventParams);
};

const adapter: BridgeAdapter = {
  ethereum: constructParams("ethereum"),
  /*
  polygon: constructParams("polygon"),
  fantom: constructParams("fantom"),
  avalanche: constructParams("avax"),
  bsc: constructParams("bsc"),
  */
};

export default adapter;

module.exports = {
  APP_NAME: "planner-sidecar",
  VERSION: "2.2.0",
  ALLOW_AUTO_EXECUTION: false,
  SUPPORTED_VENUES: ["binance", "pancakeswap"],
  supportedChains: { 1: "Ethereum Mainnet", 56: "BSC Mainnet" },
  defaultSlippage: { pancakeswap: 50 },
  venues: { pancakeswap: { defaultChain: 56 } }
};

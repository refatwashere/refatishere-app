const { adaptPancakeSwapIntent } = require("../vercel-sidecar/pancakeswapAiAdapter");

const result = adaptPancakeSwapIntent({
  tokenIn: "WBNB",
  tokenOut: "USDT",
  amountIn: 0.1
});

const required = ["trade_intent", "risk_assessment", "execution_plan", "meta"];
for (const key of required) {
  if (!(key in result)) {
    console.error("Missing key:", key);
    process.exit(1);
  }
}
console.log(JSON.stringify(result, null, 2));

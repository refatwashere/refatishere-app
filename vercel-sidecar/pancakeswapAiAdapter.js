function adaptPancakeSwapIntent(input = {}) {
  const tokenIn = input.tokenIn || "WBNB";
  const tokenOut = input.tokenOut || "USDT";
  const amountIn = Number(input.amountIn || 0);
  const side = String(input.side || "BUY").toUpperCase();
  return {
    trade_intent: {
      venue: "pancakeswap",
      symbol: `${tokenIn}/${tokenOut}`,
      side,
      size: amountIn,
      confidence: 0.58,
      rationale: "Route-aware advisory generated through PancakeSwap adapter.",
      risk_flags: ["slippage", "routing-risk", "smart-contract-risk"]
    },
    risk_assessment: {
      score: 46,
      level: "medium",
      flags: ["slippage", "routing-risk", "smart-contract-risk"]
    },
    execution_plan: {
      mode: "assisted",
      steps: [
        { step: 1, description: "Check route quality and pool liquidity." },
        { step: 2, description: "Confirm slippage tolerance before signing." }
      ],
      deep_link: "https://pancakeswap.finance/swap"
    },
    meta: {
      adapter: "pancakeswap-ai",
      adapter_status: "active"
    }
  };
}
module.exports = { adaptPancakeSwapIntent };

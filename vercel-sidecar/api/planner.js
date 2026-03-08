const CONFIG = require("../config");
const { adaptPancakeSwapIntent } = require("../pancakeswapAiAdapter");

function requirePlannerToken(req, res) {
  const expected = process.env.PLANNER_SIDECAR_TOKEN || "";
  const given = req.headers["x-planner-token"] || "";
  if (expected && expected !== given) {
    res.status(401).json({ status: "error", message: "Unauthorized planner token", error: "unauthorized" });
    return false;
  }
  return true;
}

function validationError(res, errors) {
  return res.status(422).json({ status: "error", validation_errors: errors });
}

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Planner-Token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });
  if (!requirePlannerToken(req, res)) return;

  const body = req.body || {};
  const requestId = `pln_${Math.random().toString(36).slice(2, 10)}`;
  const venue = String(body.venue || "binance").toLowerCase();
  const provider = String(body.provider || "sidecar").toLowerCase();
  const side = String(body.side || "").toUpperCase();
  const type = String(body.type || "MARKET").toUpperCase();
  const mode = String(body.mode || "spot").toLowerCase();

  const errors = [];
  if (!["BUY", "SELL"].includes(side)) errors.push({ field: "side", message: "side must be BUY or SELL" });

  if (venue === "binance") {
    const symbol = String(body.symbol || "").toUpperCase();
    const size = Number(body.size || 0);
    const limitPrice = body.limitPrice == null || body.limitPrice === "" ? null : Number(body.limitPrice);
    if (!symbol) errors.push({ field: "symbol", message: "symbol is required" });
    if (!(size > 0)) errors.push({ field: "size", message: "size must be positive" });
    if (!["MARKET", "LIMIT"].includes(type)) errors.push({ field: "type", message: "type must be MARKET or LIMIT" });
    if (type === "LIMIT" && !(limitPrice > 0)) errors.push({ field: "limitPrice", message: "limitPrice required for LIMIT" });
    if (errors.length) return validationError(res, errors);

    return res.status(200).json({
      status: "success",
      data: {
        trade_intent: {
          venue: "binance",
          symbol,
          side,
          size,
          confidence: 0.64,
          rationale: "Sidecar generated Binance advisory.",
          risk_flags: ["market_order_slippage"]
        },
        execution_plan: {
          mode: "assisted",
          steps: [
            { step: 1, description: "Review symbol, side, and size against strategy." },
            { step: 2, description: "Confirm invalidation and venue context before manual execution." }
          ],
          deep_link: `https://www.binance.com/en/trade/${symbol.replace("USDT", "_USDT")}?type=spot`
        },
        risk_assessment: {
          score: 38,
          level: "medium",
          flags: ["market_order_slippage"]
        },
        meta: {
          source: "sidecar",
          adapter: "native-binance",
          adapter_status: "native",
          provider,
          planner_version: "2.2.0",
          venue: "binance",
          mode,
          request_id: requestId
        }
      },
      request_id: requestId
    });
  }

  const chainId = Number(body.chainId ?? CONFIG.venues.pancakeswap.defaultChain);
  const tokenIn = String(body.tokenIn || "").trim();
  const tokenOut = String(body.tokenOut || "").trim();
  const amountIn = Number(body.amountIn || 0);
  const slippageBps = Number(body.slippageBps ?? CONFIG.defaultSlippage.pancakeswap);
  const routeType = String(body.routeType || "auto");

  if (!tokenIn) errors.push({ field: "tokenIn", message: "tokenIn is required" });
  if (!tokenOut) errors.push({ field: "tokenOut", message: "tokenOut is required" });
  if (tokenIn && tokenOut && tokenIn === tokenOut) errors.push({ field: "tokenOut", message: "token pair must differ" });
  if (!(amountIn > 0)) errors.push({ field: "amountIn", message: "amountIn must be positive" });
  if (!Object.keys(CONFIG.supportedChains).map(Number).includes(chainId)) errors.push({ field: "chainId", message: "chainId is unsupported" });
  if (errors.length) return validationError(res, errors);

  let adapted;
  try {
    adapted = adaptPancakeSwapIntent({ chainId, tokenIn, tokenOut, amountIn, slippageBps, routeType, side });
    adapted.meta = Object.assign({}, adapted.meta || {}, {
      source: "sidecar",
      provider,
      planner_version: "2.2.0",
      venue: "pancakeswap",
      chain_id: chainId,
      request_id: requestId
    });
  } catch (err) {
    adapted = {
      trade_intent: {
        venue: "pancakeswap",
        symbol: `${tokenIn}/${tokenOut}`,
        side,
        size: amountIn,
        confidence: 0.54,
        rationale: "Fallback PancakeSwap advisory.",
        risk_flags: ["slippage", "routing-risk", "smart-contract-risk"]
      },
      execution_plan: {
        mode: "assisted",
        steps: [
          { step: 1, description: "Check route quality and pool liquidity." },
          { step: 2, description: "Confirm slippage tolerance before signing." }
        ],
        deep_link: "https://pancakeswap.finance/swap"
      },
      risk_assessment: {
        score: 46,
        level: "medium",
        flags: ["slippage", "routing-risk", "smart-contract-risk"]
      },
      meta: {
        source: "sidecar",
        adapter: "local-fallback",
        adapter_status: "fallback",
        adapter_failure_reason: "adapter_error",
        adapter_failure_message: String(err && err.message ? err.message : "adapter failed"),
        provider,
        planner_version: "2.2.0",
        venue: "pancakeswap",
        chain_id: chainId,
        request_id: requestId
      }
    };
  }

  return res.status(200).json({ status: "success", data: adapted, request_id: requestId });
};

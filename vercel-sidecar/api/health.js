const CONFIG = require("../config");

module.exports = (req, res) => {
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Planner-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    status: "success",
    data: {
      ready: true,
      version: CONFIG.VERSION,
      features: ["binance", "pancakeswap", "native-binance", "adapter-fallback"],
      supported_chains: Object.keys(CONFIG.supportedChains).map(Number),
      supported_venues: CONFIG.SUPPORTED_VENUES,
      adapter: {
        pancakeswap_ai_enabled: Boolean(process.env.PANCAKESWAP_AI_API_URL),
        timeout_ms: Number(process.env.PANCAKESWAP_AI_TIMEOUT_MS || 8000)
      }
    }
  });
};

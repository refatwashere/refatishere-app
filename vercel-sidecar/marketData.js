function getMockMarketContext(symbol = "BTCUSDT") {
  const base = symbol.includes("ETH") ? 3200 : symbol.includes("BNB") ? 570 : symbol.includes("DOGE") ? 0.18 : 64000;
  return { symbol, lastPrice: base, trend: "mixed-to-bullish", volatility: "moderate", sourceState: "Fallback" };
}
module.exports = { getMockMarketContext };

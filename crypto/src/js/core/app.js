(() => {
  const DEFAULT_BACKEND_TOKEN = "dev-crypto-token";
  const THEME_KEY = "workspace_theme";
  const DENSITY_KEY = "workspace_density";
  const MOTION_KEY = "workspace_motion";
  const FOCUS_KEY = "workspace_focus";

  const state = {
    symbol: localStorage.getItem("crypto.symbol") || "BTCUSDT",
    interval: localStorage.getItem("crypto.interval") || "15m",
    watchlist: JSON.parse(localStorage.getItem("watchlist") || "null") || ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","DOTUSDT","MATICUSDT","AVAXUSDT","LINKUSDT","UNIUSDT"],
    alerts: JSON.parse(localStorage.getItem("priceAlerts") || "[]"),
    journal: JSON.parse(localStorage.getItem("cryptoTrades") || "[]"),
    trades: [],
    klines: [],
    lastPrice: null,
    ws: null,
    tickerData: JSON.parse(localStorage.getItem("liveTickerData") || "{}"),
    lastOrderClientId: localStorage.getItem("lastOrderClientId") || "",
    focusMode: localStorage.getItem(FOCUS_KEY) === "true",
    settings: {
      backendToken: localStorage.getItem("backend_api_token") || DEFAULT_BACKEND_TOKEN,
      binanceKey: localStorage.getItem("binance_api_key") || "",
      binanceSecret: localStorage.getItem("binance_api_secret") || "",
      useTestnet: localStorage.getItem("use_testnet") || "true",
      recvWindow: localStorage.getItem("binance_recv_window") || "5000",
      plannerEnabled: localStorage.getItem("planner_enabled") || "false",
      plannerProvider: localStorage.getItem("planner_provider") || "local",
      plannerVenue: localStorage.getItem("planner_venue") || "binance",
      plannerChainId: localStorage.getItem("planner_chain_id") || "56"
    },
    fetchNonce: 0
  };

  const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","DOTUSDT","MATICUSDT","AVAXUSDT","LINKUSDT","UNIUSDT"];
  const intervals = ["1m","5m","10m","15m","30m","1h","4h","1d"];
  const q = id => document.getElementById(id);
  const fmt = (n, d=2) => n == null || Number.isNaN(Number(n)) ? "-" : Number(n).toLocaleString(undefined, {maximumFractionDigits:d});

  const commands = [
    {label:"Refresh chart", run:() => fetchKlines()},
    {label:"Load account snapshot", run:() => loadAccount()},
    {label:"Load open orders", run:() => loadOrders()},
    {label:"Check sidecar health", run:() => checkSidecarHealth()},
    {label:"Clean kline cache", run:() => cleanupCache()},
    {label:"Toggle focus mode", run:() => toggleFocusMode()},
    {label:"Generate planner output", run:() => plannerRequest()},
  ];

  function priceDecimals(symbol) {
    if ((symbol || "").startsWith("DOGE")) return 5;
    if ((symbol || "").startsWith("XRP") || (symbol || "").startsWith("ADA") || (symbol || "").startsWith("MATIC")) return 4;
    if ((symbol || "").startsWith("BTC")) return 2;
    return 3;
  }

  function intervalCacheKey(symbol, interval) { return `intervalData:${symbol}:${interval}`; }

  function saveState() {
    localStorage.setItem("crypto.symbol", state.symbol);
    localStorage.setItem("crypto.interval", state.interval);
    localStorage.setItem("watchlist", JSON.stringify(state.watchlist));
    localStorage.setItem("priceAlerts", JSON.stringify(state.alerts));
    localStorage.setItem("cryptoTrades", JSON.stringify(state.journal));
    localStorage.setItem("liveTickerData", JSON.stringify(state.tickerData));
    localStorage.setItem("lastOrderClientId", state.lastOrderClientId || "");
    localStorage.setItem("backend_api_token", state.settings.backendToken);
    localStorage.setItem("binance_api_key", state.settings.binanceKey);
    localStorage.setItem("binance_api_secret", state.settings.binanceSecret);
    localStorage.setItem("use_testnet", state.settings.useTestnet);
    localStorage.setItem("binance_recv_window", state.settings.recvWindow);
    localStorage.setItem("planner_enabled", state.settings.plannerEnabled);
    localStorage.setItem("planner_provider", state.settings.plannerProvider);
    localStorage.setItem("planner_venue", state.settings.plannerVenue);
    localStorage.setItem("planner_chain_id", state.settings.plannerChainId);
    localStorage.setItem(FOCUS_KEY, String(state.focusMode));
  }

  function applyAppearance() {
    const body = document.body;
    body.classList.remove("theme-aurora","theme-midnight","theme-ocean","compact","reduced-motion","focus-mode");
    const theme = localStorage.getItem(THEME_KEY) || "aurora";
    const density = localStorage.getItem(DENSITY_KEY) || "comfortable";
    const motion = localStorage.getItem(MOTION_KEY) || "soft";
    body.classList.add(`theme-${theme}`);
    if (density === "compact") body.classList.add("compact");
    if (motion === "reduced") body.classList.add("reduced-motion");
    if (state.focusMode) body.classList.add("focus-mode");
    q("themeSelect").value = theme;
    q("densitySelect").value = density;
    q("motionSelect").value = motion;
  }

  function backendHeaders() { return {"Content-Type":"application/json", "X-API-Token": state.settings.backendToken || DEFAULT_BACKEND_TOKEN}; }

  function ema(values, period) {
    if (!values.length) return [];
    const k = 2 / (period + 1);
    let prev = values[0];
    return values.map((v, i) => i === 0 ? prev : (prev = v * k + prev * (1 - k)));
  }

  function rsi(values, period = 14) {
    if (values.length < period + 1) return [];
    const out = new Array(values.length).fill(null);
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const d = values[i] - values[i - 1];
      if (d >= 0) gains += d; else losses += Math.abs(d);
    }
    let avgGain = gains / period, avgLoss = losses / period;
    out[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    for (let i = period + 1; i < values.length; i++) {
      const d = values[i] - values[i - 1];
      const g = d > 0 ? d : 0;
      const l = d < 0 ? Math.abs(d) : 0;
      avgGain = ((avgGain * (period - 1)) + g) / period;
      avgLoss = ((avgLoss * (period - 1)) + l) / period;
      out[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }
    return out;
  }

  function buildMockKlines(base=64000) {
    const rows = []; let p = base;
    for (let i = 0; i < 100; i++) {
      const drift = (Math.random() - 0.48) * (base * 0.003);
      const open = p, close = Math.max(0.0001, p + drift);
      const high = Math.max(open, close) + Math.random() * base * 0.001;
      const low = Math.min(open, close) - Math.random() * base * 0.001;
      rows.push({time: Date.now() - (100 - i) * 60000, open, high, low, close, volume: 100 + Math.random() * 500});
      p = close;
    }
    return rows;
  }

  async function postCrypto(action, payload) {
    const res = await fetch(`../backend/api.php?action=${encodeURIComponent(action)}`, {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify(payload || {})
    });
    return res.json();
  }

  function localIntervalData(symbol, interval) {
    try {
      const raw = localStorage.getItem(intervalCacheKey(symbol, interval));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
  }

  function storeIntervalData(symbol, interval, rows) {
    try { localStorage.setItem(intervalCacheKey(symbol, interval), JSON.stringify(rows)); } catch {}
  }

  async function loadTrades() {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "25");
    const from = q("tradeFromInput").value;
    const to = q("tradeToInput").value;
    const sort = q("tradeSortSelect").value;
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort) params.set("sort", sort);
    try {
      const res = await fetch(`../../api/trades.php?${params.toString()}`, {headers: {"X-API-Token": state.settings.backendToken || DEFAULT_BACKEND_TOKEN}});
      const json = await res.json();
      state.trades = json.status === "success" && Array.isArray(json.data) ? json.data : [];
    } catch { state.trades = []; }
    renderTrades();
  }

  async function loadJournal() {
    try {
      const res = await fetch("../../api/journal.php", {headers: {"X-API-Token": state.settings.backendToken || DEFAULT_BACKEND_TOKEN}});
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        state.journal = json.data.map(r => ({
          id:r.id,symbol:r.symbol,side:r.side,entry:Number(r.entry_price ?? r.entry),exit:Number(r.exit_price ?? r.exit),qty:Number(r.qty),pnl:Number(r.pnl),notes:r.notes || "",setupTag:r.setup_tag || ""
        }));
        saveState();
      }
    } catch {}
    renderJournal();
  }

  async function fetchKlines() {
    const nonce = ++state.fetchNonce;
    q("sourceBadge").textContent = "Loading";
    q("statusLine").textContent = `Loading ${state.symbol} ${state.interval}...`;
    try {
      const json = await Promise.race([
        postCrypto("klines", {symbol: state.symbol, interval: state.interval, limit: 100}),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 9000))
      ]);
      if (nonce !== state.fetchNonce) return;
      if ((json.status === "success" || json.success === true) && Array.isArray(json.data) && json.data.length) {
        state.klines = json.data;
        storeIntervalData(state.symbol, state.interval, json.data);
        q("sourceBadge").textContent = json.meta?.sourceState || "Proxy";
      } else throw new Error("No data");
    } catch {
      const local = localIntervalData(state.symbol, state.interval);
      if (local && local.length) {
        if (nonce !== state.fetchNonce) return;
        state.klines = local;
        q("sourceBadge").textContent = "Degraded";
      } else {
        state.klines = buildMockKlines(state.symbol.startsWith("ETH") ? 3200 : state.symbol.startsWith("BNB") ? 570 : state.symbol.startsWith("DOGE") ? 0.18 : 64000);
        q("sourceBadge").textContent = "Fallback";
      }
    }
    const closes = state.klines.map(k => Number(k.close));
    state.lastPrice = closes.at(-1) || null;
    q("lastPrice").textContent = fmt(state.lastPrice, priceDecimals(state.symbol));
    renderChart(); renderSignals(); checkAlerts();
    q("statusLine").textContent = `Loaded ${state.klines.length} bars for ${state.symbol}.`;
  }

  function renderChart() {
    const canvas = q("priceCanvas"), ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = state.klines;
    if (!data.length) return;
    const pad = 42;
    const prices = data.flatMap(k => [Number(k.high), Number(k.low)]);
    const min = Math.min(...prices), max = Math.max(...prices);
    const sx = i => pad + (i / Math.max(1, data.length - 1)) * (canvas.width - pad * 2);
    const sy = v => canvas.height - pad - ((v - min) / Math.max(1e-9, max - min)) * (canvas.height - pad * 2);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    for (let i = 0; i < 5; i++) {
      const y = pad + i * ((canvas.height - pad * 2) / 4);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(canvas.width - pad, y); ctx.stroke();
    }
    const candleW = Math.max(3, (canvas.width - pad * 2) / data.length * 0.58);
    data.forEach((k, i) => {
      const x = sx(i), o = sy(+k.open), c = sy(+k.close), h = sy(+k.high), l = sy(+k.low);
      const up = +k.close >= +k.open;
      ctx.strokeStyle = up ? "#66d7a0" : "#ff8e9d";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x, l); ctx.stroke();
      const top = Math.min(o, c), height = Math.max(2, Math.abs(c - o));
      ctx.globalAlpha = .88; ctx.fillRect(x - candleW/2, top, candleW, height); ctx.globalAlpha = 1;
    });
    const closes = data.map(k => +k.close);
    const e9 = ema(closes, 9), e21 = ema(closes, 21), rr = rsi(closes, 14);
    const draw = (series, color) => {
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = sx(i), y = sy(v);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    };
    draw(e9, "#8bb6ff"); draw(e21, "#73e3d0");
    const last = closes.at(-1), y = sy(last);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(canvas.width - pad, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#eef5ff"; ctx.fillText(`Last: ${fmt(last, priceDecimals(state.symbol))}`, canvas.width - pad - 150, y - 6);
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.beginPath(); ctx.rect(pad, canvas.height - 94, canvas.width - pad * 2, 54); ctx.stroke();
    [30,50,70].forEach(level => {
      const yy = canvas.height - 40 - (level/100)*54;
      ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(canvas.width - pad, yy); ctx.stroke();
    });
    ctx.beginPath();
    rr.forEach((v, i) => {
      if (v == null) return;
      const x = sx(i), yy = canvas.height - 40 - (v/100)*54;
      if (i === 14) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    });
    ctx.strokeStyle = "#f6ca76"; ctx.lineWidth = 1.5; ctx.stroke();
    q("emaSpread").textContent = fmt(e9.at(-1) - e21.at(-1), priceDecimals(state.symbol));
    q("rsiValue").textContent = fmt(rr.at(-1), 2);
  }

  function renderSignals() {
    const closes = state.klines.map(k => +k.close), e9 = ema(closes, 9), e21 = ema(closes, 21), rr = rsi(closes, 14);
    let cross = "No conservative marker condition.";
    for (let i = 1; i < e9.length; i++) {
      const bullishCross = e9[i - 1] <= e21[i - 1] && e9[i] > e21[i] && rr[i] >= 50 && rr[i] <= 70;
      const bearishCross = e9[i - 1] >= e21[i - 1] && e9[i] < e21[i] && rr[i] >= 30 && rr[i] <= 50;
      if (bullishCross) cross = "Bullish marker when EMA9 crossed above EMA21 with RSI in 50–70.";
      if (bearishCross) cross = "Bearish marker when EMA9 crossed below EMA21 with RSI in 30–50.";
    }
    const trend = e9.at(-1) > e21.at(-1) ? "Bullish bias" : "Bearish bias";
    const momentum = rr.at(-1) > 70 ? "Overbought" : rr.at(-1) < 30 ? "Oversold" : "Balanced";
    q("signalSummary").innerHTML = `<div><strong>Trend:</strong> ${trend}</div><div><strong>Momentum:</strong> ${momentum}</div><div><strong>Conservative logic:</strong> ${cross}</div><div><strong>Last Price:</strong> ${fmt(closes.at(-1), priceDecimals(state.symbol))}</div>`;
    q("insightBar").innerHTML = [trend, momentum, `${state.symbol} • ${state.interval}`, q("sourceBadge").textContent || "Source unknown"].map(txt => `<span class="insight-chip">${txt}</span>`).join("");
  }

  function renderWatchlist() { q("watchlist").innerHTML = state.watchlist.map(s => `<span class="status-pill">${s}</span>`).join(""); }

  function renderAlerts() {
    q("alertsList").innerHTML = state.alerts.map((a, i) => `<li>${a.symbol} @ ${fmt(a.price, priceDecimals(a.symbol || state.symbol))} <button data-i="${i}" class="ghost-btn">x</button></li>`).join("");
    q("alertsList").querySelectorAll("button[data-i]").forEach(btn => {
      btn.onclick = () => {
        state.alerts.splice(Number(btn.dataset.i), 1);
        saveState(); renderAlerts();
      };
    });
  }

  function checkAlerts() {
    if (state.lastPrice == null) return;
    const hits = state.alerts.filter(a => a.symbol === state.symbol && state.lastPrice >= Number(a.price));
    if (hits.length) q("statusLine").textContent = `Alert hit on ${state.symbol}. Price is ${fmt(state.lastPrice, priceDecimals(state.symbol))}.`;
  }

  function renderJournal() {
    const filter = (q("journalFilterInput").value || "").toLowerCase().trim();
    const rows = state.journal.filter(j => {
      const hay = `${j.symbol} ${j.side} ${j.notes || ""} ${j.setupTag || ""}`.toLowerCase();
      return !filter || hay.includes(filter);
    });
    q("journalTableWrap").innerHTML = `<table><thead><tr><th>#</th><th>Symbol</th><th>Side</th><th>Entry</th><th>Exit</th><th>Qty</th><th>P/L</th></tr></thead><tbody>${rows.map((j, i) => `<tr><td>${i+1}</td><td>${j.symbol}</td><td>${j.side}</td><td>${fmt(j.entry, priceDecimals(j.symbol))}</td><td>${fmt(j.exit, priceDecimals(j.symbol))}</td><td>${fmt(j.qty,4)}</td><td class="${j.pnl >= 0 ? 'profit' : 'loss'}">${fmt(j.pnl,4)}</td></tr>`).join("") || '<tr><td colspan="7">No journal entries yet.</td></tr>'}</tbody></table>`;
    q("journalPnl").textContent = fmt(state.journal.reduce((s, r) => s + Number(r.pnl || 0), 0), 4);
  }

  function renderTrades() {
    q("tradesTableWrap").innerHTML = `<table><thead><tr><th>ID</th><th>Pair</th><th>Qty</th><th>Entry</th><th>Exit</th><th>Fees</th><th>Learnings</th></tr></thead><tbody>${state.trades.map(t => `<tr><td>${t.id}</td><td>${t.pair}</td><td>${fmt(t.quantity,4)}</td><td>${fmt(t.entry_price, priceDecimals(t.pair || state.symbol))}</td><td>${fmt(t.exit_price, priceDecimals(t.pair || state.symbol))}</td><td>${fmt(t.fees,4)}</td><td>${t.learnings || '-'}</td></tr>`).join("") || '<tr><td colspan="7">No trade rows yet.</td></tr>'}</tbody></table>`;
  }

  function renderTicker() {
    const pairs = state.watchlist.slice(0, 12);
    q("marketCards").innerHTML = pairs.map(sym => {
      const data = state.tickerData[sym] || {};
      const px = data.c != null ? fmt(data.c, priceDecimals(sym)) : "-";
      const chgValue = Number(data.P || 0);
      const chg = data.P != null ? `${chgValue.toFixed(2)}%` : "-";
      const cls = chgValue >= 0 ? "up" : "down";
      return `<div class="market-card"><div class="sym">${sym}</div><div class="px">${px}</div><div class="chg ${cls}">${chg}</div></div>`;
    }).join("");
    q("tickerStrip").textContent = pairs.map(sym => {
      const data = state.tickerData[sym] || {};
      const px = data.c != null ? fmt(data.c, priceDecimals(sym)) : "-";
      const chg = data.P != null ? `${Number(data.P).toFixed(2)}%` : "-";
      return `${sym} ${px} ${chg}`;
    }).join(" • ");
  }

  function startTickerStream() {
    if (state.ws) { try { state.ws.close(); } catch {} }
    const streams = state.watchlist.slice(0, 12).map(s => `${s.toLowerCase()}@miniTicker`).join("/");
    try {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      state.ws = ws;
      q("wsStateBadge").textContent = "Connecting";
      ws.onopen = () => { q("wsStateBadge").textContent = "Live"; };
      ws.onclose = () => { q("wsStateBadge").textContent = "Closed"; };
      ws.onerror = () => { q("wsStateBadge").textContent = "Error"; };
      ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);
          const data = msg.data || {};
          if (!data.s) return;
          state.tickerData[data.s] = data;
          saveState(); renderTicker();
        } catch {}
      };
    } catch { q("wsStateBadge").textContent = "Unavailable"; }
  }

  function loadSettingsIntoUI() {
    q("backendTokenInput").value = state.settings.backendToken;
    q("binanceKeyInput").value = state.settings.binanceKey;
    q("binanceSecretInput").value = state.settings.binanceSecret;
    q("useTestnetSelect").value = state.settings.useTestnet;
    q("recvWindowInput").value = state.settings.recvWindow;
    q("plannerEnabledSelect").value = state.settings.plannerEnabled;
    q("plannerProviderSelect").value = state.settings.plannerProvider;
    q("plannerVenueSelect").value = state.settings.plannerVenue;
    q("plannerChainIdInput").value = state.settings.plannerChainId;
  }

  function saveSettingsFromUI() {
    state.settings.backendToken = q("backendTokenInput").value.trim() || DEFAULT_BACKEND_TOKEN;
    state.settings.binanceKey = q("binanceKeyInput").value.trim();
    state.settings.binanceSecret = q("binanceSecretInput").value.trim();
    state.settings.useTestnet = q("useTestnetSelect").value;
    state.settings.recvWindow = q("recvWindowInput").value || "5000";
    state.settings.plannerEnabled = q("plannerEnabledSelect").value;
    state.settings.plannerProvider = q("plannerProviderSelect").value;
    state.settings.plannerVenue = q("plannerVenueSelect").value;
    state.settings.plannerChainId = q("plannerChainIdInput").value || "56";
    localStorage.setItem(THEME_KEY, q("themeSelect").value);
    localStorage.setItem(DENSITY_KEY, q("densitySelect").value);
    localStorage.setItem(MOTION_KEY, q("motionSelect").value);
    saveState(); applyAppearance(); startTickerStream();
    q("statusLine").textContent = "Settings saved.";
  }

  function clearSensitiveSettings() {
    state.settings.backendToken = DEFAULT_BACKEND_TOKEN;
    state.settings.binanceKey = "";
    state.settings.binanceSecret = "";
    saveState(); loadSettingsIntoUI();
    q("statusLine").textContent = "Sensitive settings cleared locally.";
  }

  function toggleFocusMode() { state.focusMode = !state.focusMode; saveState(); applyAppearance(); }

  function openCommandPalette() {
    q("commandPalette").classList.remove("hidden");
    q("commandPalette").setAttribute("aria-hidden", "false");
    renderCommands("");
    q("commandInput").focus();
  }
  function closeCommandPalette() {
    q("commandPalette").classList.add("hidden");
    q("commandPalette").setAttribute("aria-hidden", "true");
  }
  function renderCommands(filterText) {
    const ft = (filterText || "").toLowerCase().trim();
    const items = commands.filter(c => !ft || c.label.toLowerCase().includes(ft));
    q("commandList").innerHTML = items.map((c, i) => `<div class="command-item" data-i="${i}">${c.label}</div>`).join("") || `<div class="command-item">No matching actions</div>`;
    q("commandList").querySelectorAll(".command-item[data-i]").forEach((el, idx) => {
      el.onclick = () => { items[idx].run(); closeCommandPalette(); };
    });
  }

  async function plannerRequest() {
    if (state.settings.plannerEnabled !== "true") {
      q("plannerOutput").textContent = JSON.stringify({status:"error", message:"planner_enabled is false in local settings"}, null, 2);
      return;
    }
    const provider = state.settings.plannerProvider;
    const venue = state.settings.plannerVenue;
    const side = q("plannerSideSelect").value;
    const size = Number(q("plannerSizeInput").value || 0);
    const prompt = q("plannerPrompt").value.trim();
    const payload = {side, provider, venue, symbol: state.symbol, size, marketPrice: state.lastPrice, prompt, type: q("plannerLimitPriceInput").value ? "LIMIT" : "MARKET", limitPrice: q("plannerLimitPriceInput").value ? Number(q("plannerLimitPriceInput").value) : null, mode: "spot"};
    if (venue === "pancakeswap") {
      payload.chainId = Number(q("plannerChainIdInput").value || state.settings.plannerChainId || 56);
      payload.tokenIn = q("plannerTokenInInput").value.trim();
      payload.tokenOut = q("plannerTokenOutInput").value.trim();
      payload.amountIn = Number(q("plannerAmountInInput").value || 0);
      payload.size = payload.amountIn;
      payload.slippageBps = Number(q("plannerSlippageInput").value || 50);
      payload.routeType = q("plannerRouteTypeSelect").value;
    }
    try {
      const json = await postCrypto("planner-intent", payload);
      q("plannerOutput").textContent = JSON.stringify(json, null, 2);
    } catch {
      q("plannerOutput").textContent = JSON.stringify({status:"error", message:"planner_unavailable"}, null, 2);
    }
  }

  async function loadAccount() {
    try {
      const json = await postCrypto("account", {apiKey: state.settings.binanceKey, apiSecret: state.settings.binanceSecret, useTestnet: state.settings.useTestnet === "true", recvWindow: Number(state.settings.recvWindow || 5000)});
      q("privateOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("privateOutput").textContent = JSON.stringify({status:"error", message:"account_load_failed"}, null, 2); }
  }

  async function loadOrders() {
    try {
      const json = await postCrypto("orders", {apiKey: state.settings.binanceKey, apiSecret: state.settings.binanceSecret, useTestnet: state.settings.useTestnet === "true", recvWindow: Number(state.settings.recvWindow || 5000), symbol: state.symbol});
      q("privateOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("privateOutput").textContent = JSON.stringify({status:"error", message:"orders_load_failed"}, null, 2); }
  }

  async function checkSidecarHealth() {
    try {
      const json = await postCrypto("sidecar-health", {});
      q("privateOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("privateOutput").textContent = JSON.stringify({status:"error", message:"sidecar_health_failed"}, null, 2); }
  }

  async function cleanupCache() {
    try {
      const json = await postCrypto("cache-cleanup", {});
      q("privateOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("privateOutput").textContent = JSON.stringify({status:"error", message:"cache_cleanup_failed"}, null, 2); }
  }

  async function submitOrder(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.useTestnet = state.settings.useTestnet === "true";
    payload.apiKey = state.settings.binanceKey;
    payload.apiSecret = state.settings.binanceSecret;
    payload.recvWindow = Number(state.settings.recvWindow || 5000);
    payload.quantity = Number(payload.quantity);
    payload.dryRun = true;
    if (payload.price) payload.price = Number(payload.price);
    try {
      const json = await postCrypto("order", payload);
      state.lastOrderClientId = json?.data?.clientOrderId || payload.newClientOrderId || "";
      saveState();
      q("orderOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("orderOutput").textContent = JSON.stringify({status:"error", message:"order_submit_failed"}, null, 2); }
  }

  async function checkOrderStatus() {
    try {
      const json = await postCrypto("order-status", {apiKey: state.settings.binanceKey, apiSecret: state.settings.binanceSecret, useTestnet: state.settings.useTestnet === "true", recvWindow: Number(state.settings.recvWindow || 5000), symbol: state.symbol, origClientOrderId: state.lastOrderClientId || undefined});
      q("orderOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("orderOutput").textContent = JSON.stringify({status:"error", message:"order_status_failed"}, null, 2); }
  }

  async function cancelOrder() {
    try {
      const json = await postCrypto("cancel", {apiKey: state.settings.binanceKey, apiSecret: state.settings.binanceSecret, useTestnet: state.settings.useTestnet === "true", recvWindow: Number(state.settings.recvWindow || 5000), symbol: state.symbol, orderId: 101});
      q("orderOutput").textContent = JSON.stringify(json, null, 2);
    } catch { q("orderOutput").textContent = JSON.stringify({status:"error", message:"cancel_failed"}, null, 2); }
  }

  async function saveTrade(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.quantity = Number(payload.quantity);
    payload.entryPrice = Number(payload.entryPrice);
    payload.exitPrice = Number(payload.exitPrice);
    payload.fees = Number(payload.fees);
    try {
      const res = await fetch("../../api/trades.php", {method: "POST", headers: {"Content-Type":"application/json","X-API-Token": state.settings.backendToken || DEFAULT_BACKEND_TOKEN}, body: JSON.stringify(payload)});
      const json = await res.json();
      q("tradeOutput").textContent = JSON.stringify(json, null, 2);
      await loadTrades();
    } catch { q("tradeOutput").textContent = JSON.stringify({status:"error", message:"trade_save_failed"}, null, 2); }
  }

  async function addJournal(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const symbol = String(fd.get("symbol") || state.symbol || "").toUpperCase();
    const side = String(fd.get("side") || "BUY");
    const entry = Number(fd.get("entry"));
    const exit = Number(fd.get("exit"));
    const qty = Number(fd.get("qty"));
    const pnl = (side === "BUY" ? (exit - entry) : (entry - exit)) * qty;
    const payload = {symbol, side, entry, exit, qty, pnl};
    state.journal.unshift(payload);
    saveState(); renderJournal(); e.target.reset();
    try {
      await fetch("../../api/journal.php", {method: "POST", headers: {"Content-Type":"application/json","X-API-Token": state.settings.backendToken || DEFAULT_BACKEND_TOKEN}, body: JSON.stringify(payload)});
      await loadJournal();
    } catch {}
  }

  function seedJournal() {
    state.journal = [
      {symbol:"BTCUSDT",side:"BUY",entry:63120,exit:64010,qty:0.01,pnl:8.9,notes:"EMA pullback"},
      {symbol:"ETHUSDT",side:"SELL",entry:3250,exit:3192,qty:0.5,pnl:29.0,notes:"Breakdown follow-through"},
      {symbol:"BNBUSDT",side:"BUY",entry:565,exit:559,qty:1.2,pnl:-7.2,notes:"Weak retest"}
    ];
    saveState(); renderJournal();
  }

  function exportJournal() {
    const blob = new Blob([JSON.stringify(state.journal, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "journal.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function bindGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key === "Escape") closeCommandPalette();
    });
    q("commandBtn").onclick = openCommandPalette;
    q("commandPalette").querySelector(".palette-backdrop").onclick = closeCommandPalette;
    q("commandInput").addEventListener("input", e => renderCommands(e.target.value));
  }

  function init() {
    q("symbolSelect").innerHTML = symbols.map(s => `<option ${s===state.symbol?"selected":""}>${s}</option>`).join("");
    q("intervalSelect").innerHTML = intervals.map(s => `<option ${s===state.interval?"selected":""}>${s}</option>`).join("");
    q("symbolSelect").onchange = e => { state.symbol = e.target.value; saveState(); fetchKlines(); };
    q("intervalSelect").onchange = e => { state.interval = e.target.value; saveState(); fetchKlines(); };
    q("refreshBtn").onclick = fetchKlines;
    q("pulseRefreshBtn").onclick = renderSignals;
    q("reloadJournalBtn").onclick = loadJournal;
    q("reloadTradesBtn").onclick = loadTrades;
    q("applyTradeFiltersBtn").onclick = loadTrades;
    q("seedBtn").onclick = seedJournal;
    q("exportBtn").onclick = exportJournal;
    q("saveSettingsBtn").onclick = saveSettingsFromUI;
    q("clearSettingsBtn").onclick = clearSensitiveSettings;
    q("plannerBtn").onclick = plannerRequest;
    q("loadAccountBtn").onclick = loadAccount;
    q("loadOrdersBtn").onclick = loadOrders;
    q("checkSidecarBtn").onclick = checkSidecarHealth;
    q("cleanupCacheBtn").onclick = cleanupCache;
    q("checkStatusBtn").onclick = checkOrderStatus;
    q("cancelOrderBtn").onclick = cancelOrder;
    q("focusModeBtn").onclick = toggleFocusMode;
    q("addAlertBtn").onclick = () => {
      const price = Number(q("alertPrice").value);
      if (!price) return;
      state.alerts.push({symbol: state.symbol, price});
      saveState(); renderAlerts();
      q("alertPrice").value = "";
    };
    q("themeSelect").onchange = saveSettingsFromUI;
    q("densitySelect").onchange = saveSettingsFromUI;
    q("motionSelect").onchange = saveSettingsFromUI;
    q("journalFilterInput").oninput = renderJournal;
    q("journalForm").onsubmit = addJournal;
    q("tradeForm").onsubmit = saveTrade;
    q("orderForm").onsubmit = submitOrder;

    loadSettingsIntoUI();
    applyAppearance();
    bindGlobalShortcuts();
    renderWatchlist();
    renderAlerts();
    renderJournal();
    renderTrades();
    renderTicker();
    loadJournal();
    loadTrades();
    fetchKlines();
    startTickerStream();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

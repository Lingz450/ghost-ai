import ccxt from "ccxt";

const EX = new ccxt[process.env.EXCHANGE || "binance"]({ enableRateLimit: true });

// convert "1h" -> seconds using ccxt helper
function tfSeconds(tf) {
  const s = EX.parseTimeframe(tf);
  return s;
}

export async function fetchTicker(symbol) {
  const s = symbol.includes("/") ? symbol : `${symbol.replace("USDT","")}/USDT`;
  return EX.fetchTicker(s);
}

export async function fetchOHLCV(symbol = "BTC/USDT", tf = "1h", limit = 300) {
  const s = symbol.includes("/") ? symbol : `${symbol.replace("USDT","")}/USDT`;
  const since = EX.milliseconds() - limit * tfSeconds(tf) * 1000;
  const raw = await EX.fetchOHLCV(s, tf, since, limit);
  return raw.map(c => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4], vol: c[5] }));
}

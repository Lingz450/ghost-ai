import { latestRSI } from "../services/indicators.js";

export default async function rsi(args, reply) {
  const [tf = "1h", type = "overbought"] = args;
  const symbols = [
    "BTC/USDT","ETH/USDT","BNB/USDT","SOL/USDT","XRP/USDT",
    "DOGE/USDT","ADA/USDT","TON/USDT","AVAX/USDT","LINK/USDT",
    "OP/USDT","ARB/USDT","APT/USDT","NEAR/USDT","LTC/USDT"
  ];

  const results = [];
  for (const s of symbols) {
    try {
      const r = await latestRSI(s, tf, 14);
      if (Number.isFinite(r)) results.push({ s, r });
    } catch { /* skip */ }
  }

  const sorted = type.toLowerCase() === "oversold"
    ? results.sort((a,b)=>a.r-b.r)
    : results.sort((a,b)=>b.r-a.r);

  const top = sorted.slice(0, 10)
    .map(o => `${o.s}: ${o.r.toFixed(2)}`)
    .join("\n");

  await reply(`RSI ${type.toLowerCase()} (${tf})\n${top}`);
}

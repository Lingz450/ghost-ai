import { latestEMA } from "../services/indicators.js";

export default async function ema(args, reply) {
  const [periodStr, tf = "1h"] = args;
  const period = parseInt(periodStr, 10);
  if (!period) return reply("Usage: !ema 200 1h");
  const symbol = "BTC/USDT"; // simple MVP
  const v = await latestEMA(symbol, tf, period);
  await reply(`EMA${period} ${symbol} (${tf}): ${Number(v).toFixed(2)}`);
}

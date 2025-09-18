import { toTradingViewSymbol } from "../utils/tvSymbolMap.js";

export default async function chart(args, reply) {
  const [symbol, tf = "1h"] = args;
  if (!symbol) return reply("Usage: !chart BTCUSDT 1h");
  const link = `https://www.tradingview.com/chart/?symbol=${toTradingViewSymbol(symbol)}`;
  await reply(`📈 ${symbol.toUpperCase()} (${tf})\n${link}`);
}

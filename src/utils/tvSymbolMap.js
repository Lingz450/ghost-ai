export function toTradingViewSymbol(symbol) {
  const u = symbol.toUpperCase().replace("/", "");
  if (u.endsWith("USDT")) return `BINANCE:${u}`;
  return u;
}

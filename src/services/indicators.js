import { EMA, RSI } from "technicalindicators";
import { fetchOHLCV } from "./exchange.js";

export async function latestEMA(symbol, tf, period) {
  const candles = await fetchOHLCV(symbol, tf, 300);
  const closes = candles.map(c => c.close);
  const arr = EMA.calculate({ period, values: closes });
  return arr.at(-1);
}

export async function latestRSI(symbol, tf, period = 14) {
  const candles = await fetchOHLCV(symbol, tf, 300);
  const closes = candles.map(c => c.close);
  const arr = RSI.calculate({ period, values: closes });
  return arr.at(-1);
}

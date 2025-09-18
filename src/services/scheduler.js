import cron from "node-cron";
import { prisma } from "../db/prismaClient.js";
import { fetchTicker } from "./exchange.js";
import { send } from "./whatsapp.js";
import { META } from "../config/meta.js";

cron.schedule("* * * * *", async () => {
  const active = await prisma.alert.findMany({ where: { active: true } });
  if (!active.length) return;
  const bySymbol = active.reduce((m, a) => {
    (m[a.symbol] ||= []).push(a); return m;
  }, {});
  for (const symbol of Object.keys(bySymbol)) {
    try {
      const ticker = await fetchTicker(symbol);
      const price = ticker?.last;
      if (!price) continue;
      for (const a of bySymbol[symbol]) {
        const hit = Number(price) >= Number(a.target) ? "up" :
                    Number(price) <= Number(a.target) ? "down" : null;
        if (!hit) continue;
        await prisma.alert.update({ where: { id: a.id }, data: { active: false } });
        await send(META.defaultTo, `🔔 ${symbol} hit ${a.target}. Now ${price}`);
      }
    } catch (e) {
      console.error("alert-check", symbol, e.message);
    }
  }
});

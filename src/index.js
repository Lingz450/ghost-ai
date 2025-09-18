import express from "express";
import axios from "axios";
import cron from "node-cron";
import ccxt from "ccxt";
import { PrismaClient } from "@prisma/client";
import { EMA, RSI } from "technicalindicators";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const EX = new ccxt[process.env.EXCHANGE || "binance"]({ enableRateLimit: true });

const WA = {
  token: process.env.WHATSAPP_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_ID,
  async sendText(to, text) {
    await axios.post(
      `https://graph.facebook.com/v20.0/${this.phoneId}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
  }
};

// Webhook verify (Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

// Webhook receive
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const msg = changes?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from; // phone id
    const text = (msg.text?.body || "").trim();
    const groupId = changes?.metadata?.display_phone_number ? (process.env.WHATSAPP_GROUP_ID || from) : from;

    if (!text.startsWith("!")) return res.sendStatus(200);
    const [cmd, ...args] = text.slice(1).split(/\s+/);
    const reply = async (t) => WA.sendText(groupId, t);

    switch (cmd.toLowerCase()) {
      case "help": {
        await reply(
          "Commands:\n" +
          "!alert <symbol> <price>\n!alertlist\n!alertreset [symbol]\n!chart <symbol> [tf]\n!ema <period> <tf>\n!rsi <tf>\n!margin <balance%> <risk> <lev>\n!pnl <entry> <exit> <size>"
        );
        break;
      }
      case "alert": {
        const [symbol, price] = args;
        if (!symbol || !price) return reply("Usage: !alert BTCUSDT 65000");
        const user = await upsertUser(from);
        await prisma.alert.create({ data: { symbol: symbol.toUpperCase(), target: price, userId: user.id } });
        await reply(`🔔 Alert set for ${symbol.toUpperCase()} @ ${price}`);
        break;
      }
      case "alertlist": {
        const user = await upsertUser(from);
        const alerts = await prisma.alert.findMany({ where: { userId: user.id, active: true } });
        if (!alerts.length) return reply("No active alerts.");
        await reply("Active alerts:\n" + alerts.map(a => `• ${a.symbol} @ ${a.target}`).join("\n"));
        break;
      }
      case "alertreset": {
        const [symbol] = args;
        const where = symbol ? { symbol: symbol.toUpperCase() } : {};
        await prisma.alert.updateMany({ where: { ...where, active: true }, data: { active: false } });
        await reply(symbol ? `Alerts for ${symbol.toUpperCase()} cleared.` : "All alerts cleared.");
        break;
      }
      case "chart": {
        const [symbol, tf = "1h"] = args;
        if (!symbol) return reply("Usage: !chart BTCUSDT 1h");
        // Quick and dirty: point to TradingView thumbnail (user taps it)
        const link = `https://www.tradingview.com/chart/?symbol=${exchangeSymbolForTV(symbol)}`;
        await reply(`📈 ${symbol.toUpperCase()} (${tf})\n${link}`);
        break;
      }
      case "ema": {
        const [periodStr, tf = "1h"] = args;
        const period = parseInt(periodStr, 10);
        if (!period) return reply("Usage: !ema 200 1h");
        const symbol = "BTC/USDT"; // start simple: run on a few majors; expand later
        const emaVal = await computeEMA(symbol, tf, period);
        await reply(`EMA${period} ${symbol} (${tf}): ${emaVal.toFixed(2)}`);
        break;
      }
      case "rsi": {
        const [tf = "1h"] = args;
        const symbol = "BTC/USDT";
        const rsiVal = await computeRSI(symbol, tf, 14);
        await reply(`RSI14 ${symbol} (${tf}): ${rsiVal.toFixed(2)}`);
        break;
      }
      case "margin": {
        // !margin <balance%> <risk> <lev>   e.g., !margin 5 0.01 10
        const [balancePct, risk, lev] = args.map(Number);
        if ([balancePct, risk, lev].some(x => Number.isNaN(x))) return reply("Usage: !margin 5 0.01 10");
        const posSizePct = (balancePct / 100) * lev;
        const textOut = `Balance%: ${balancePct}%, Risk: ${risk}, Lev: ${lev}x\nSuggested position size ~ ${posSizePct.toFixed(2)}% of balance (rule-of-thumb).`;
        await reply(textOut);
        break;
      }
      case "pnl": {
        // !pnl <entry> <exit> <size>
        const [entry, exit, size] = args.map(Number);
        if ([entry, exit, size].some(Number.isNaN)) return reply("Usage: !pnl 0.5 0.65 1000");
        const pnl = (exit - entry) * size / entry * 100; // %
        await reply(`PnL: ${pnl.toFixed(2)}%`);
        break;
      }
      default:
        await reply("Unknown command. Try !help");
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e?.response?.data || e);
    res.sendStatus(200);
  }
});

async function upsertUser(waId) {
  const existing = await prisma.user.findUnique({ where: { waId } });
  if (existing) return existing;
  return prisma.user.create({ data: { waId } });
}

function exchangeSymbolForTV(s) {
  // crude mapper; adjust per exchange
  const u = s.toUpperCase().replace("/", "");
  if (u.endsWith("USDT")) return `BINANCE:${u}`;
  return u;
}

async function fetchOHLCV(symbol = "BTC/USDT", tf = "1h", limit = 300) {
  const marketSymbol = EX.market(symbol)?.symbol || symbol;
  const since = EX.milliseconds() - limit * 60 * 60 * 1000; // rough for 1h
  const timeframe = tf;
  const raw = await EX.fetchOHLCV(marketSymbol, timeframe, since, limit);
  return raw.map(c => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4], vol: c[5] }));
}

async function computeEMA(symbol, tf, period) {
  const candles = await fetchOHLCV(symbol, tf, 300);
  const closes = candles.map(c => c.close);
  const ema = EMA.calculate({ period, values: closes });
  return ema[ema.length - 1];
}

async function computeRSI(symbol, tf, period) {
  const candles = await fetchOHLCV(symbol, tf, 300);
  const closes = candles.map(c => c.close);
  const rsi = RSI.calculate({ period, values: closes });
  return rsi[rsi.length - 1];
}

// Alert scheduler every minute
cron.schedule("* * * * *", async () => {
  const active = await prisma.alert.findMany({ where: { active: true } });
  if (!active.length) return;
  // group by symbol for efficient fetch
  const bySymbol = active.reduce((m, a) => (m[a.symbol] = m[a.symbol] || [], m[a.symbol].push(a), m), {});
  for (const symbol of Object.keys(bySymbol)) {
    try {
      const ticker = await EX.fetchTicker(symbol.replace("USDT", "/USDT"));
      const price = ticker.last;
      for (const a of bySymbol[symbol]) {
        if (!price) continue;
        if ((Number(price) >= Number(a.target)) || (Number(price) <= Number(a.target))) {
          await prisma.alert.update({ where: { id: a.id }, data: { active: false } });
          await WA.sendText(process.env.WHATSAPP_GROUP_ID, `🔔 ${symbol} hit ${a.target}. Current ${price}`);
        }
      }
    } catch (e) {
      console.error("Alert check error", symbol, e.message);
    }
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Bot up on", process.env.PORT || 8080);
});

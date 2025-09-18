# Ghost AI – WhatsApp Crypto Bot (MVP)
1) Fill .env
2) `npm i`
3) `npx prisma generate && npm run prisma:mig`
4) Expose an HTTPS URL (local tunnel or deploy).
5) In Meta > WhatsApp > Webhooks: set URL to `https://YOUR_DOMAIN/webhook`, verify token = META_VERIFY_TOKEN.
6) Add the bot number to your WhatsApp group, note the group ID, put it in WHATSAPP_DEFAULT_TO.
7) Run: `npm run dev`.

Commands (prefix `!`):
- help, alert, alertlist, alertreset, chart, ema, rsi, margin, pnl, wallet

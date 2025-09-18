import { prisma } from "../db/prismaClient.js";

export default async function wallet(_args, reply, { from }) {
  const user = await prisma.user.findUnique({ where: { waId: from } });
  if (!user) return reply("No active trades.");
  const trades = await prisma.trade.findMany({ where: { userId: user.id, active: true } });
  if (!trades.length) return reply("No active trades.");
  await reply("Active trades:\n" + trades
    .map(t => `${t.symbol} size:${t.size} @ ${t.entry}`).join("\n"));
}

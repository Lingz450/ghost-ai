import { prisma } from "../db/prismaClient.js";

export default async function alert(args, reply, { from }) {
  const [symbol, price] = args;
  if (!symbol || !price) return reply("Usage: !alert BTCUSDT 65000");

  let user = await prisma.user.findUnique({ where: { waId: from } });
  if (!user) user = await prisma.user.create({ data: { waId: from } });

  await prisma.alert.create({
    data: { symbol: symbol.toUpperCase(), target: price, userId: user.id }
  });
  await reply(`🔔 Alert set for ${symbol.toUpperCase()} @ ${price}`);
}

import { prisma } from "../db/prismaClient.js";

export default async function alertreset(args, reply) {
  const [symbol] = args;
  const where = symbol ? { symbol: symbol.toUpperCase(), active: true } : { active: true };
  const count = await prisma.alert.updateMany({ where, data: { active: false } });
  await reply(count.count ? `Cleared ${count.count} alert(s).` : "No alerts to clear.");
}

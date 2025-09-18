import { prisma } from "../db/prismaClient.js";

export default async function alertlist(_args, reply, { from }) {
  const user = await prisma.user.findUnique({ where: { waId: from } });
  if (!user) return reply("No active alerts.");
  const alerts = await prisma.alert.findMany({ where: { userId: user.id, active: true } });
  if (!alerts.length) return reply("No active alerts.");
  await reply("Active alerts:\n" + alerts.map(a => `• ${a.symbol} @ ${a.target}`).join("\n"));
}

export default async function pnl(args, reply) {
  const [pair, entryStr, exitStr, sizeStr] = args;
  const entry = Number(entryStr), exit = Number(exitStr), size = Number(sizeStr);
  if (!pair || [entry, exit, size].some(Number.isNaN))
    return reply("Usage: !pnl BTCUSDT 0.50 0.65 1000");

  const pct = ((exit - entry) / entry) * 100;
  const value = (exit - entry) * size;
  await reply(`${pair.toUpperCase()} PnL: ${pct.toFixed(2)}% (${value.toFixed(2)})`);
}

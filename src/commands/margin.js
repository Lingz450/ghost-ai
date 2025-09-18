export default async function margin(args, reply) {
  const [cmp, sl, risk, lev] = args.map(Number);
  if ([cmp, sl, risk, lev].some(Number.isNaN))
    return reply("Usage: !margin <cmp> <sl> <risk> <lev>");

  const diff = Math.abs(cmp - sl);
  if (diff === 0) return reply("CMP and SL cannot be equal.");
  // position size (units) with risk in quote currency (e.g., USDT):
  const units = risk / diff;
  const notional = units * cmp;
  const marginReq = notional / lev;

  await reply(
    `CMP=${cmp}, SL=${sl}, Risk=${risk}, Lev=${lev}x\n` +
    `Position ≈ ${units.toFixed(6)} units\n` +
    `Notional ≈ ${notional.toFixed(2)}\n` +
    `Margin ≈ ${marginReq.toFixed(2)}`
  );
}

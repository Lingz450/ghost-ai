const activeGiveaways = new Map(); // channel -> { ends, prize, entrants:Set }

export default async function giveaway(args, reply, { to }) {
  const [secondsStr, ...prizeArr] = args;
  const seconds = Number(secondsStr);
  const prize = prizeArr.join(" ").trim() || "mystery prize";
  if (Number.isNaN(seconds) || seconds <= 0) return reply("Usage: !giveaway <seconds> <prize>");

  if (activeGiveaways.has(to)) return reply("A giveaway is already running.");
  const ends = Date.now() + seconds * 1000;
  const data = { ends, prize, entrants: new Set(["you"])}; // placeholder entrants
  activeGiveaways.set(to, data);

  setTimeout(async () => {
    const d = activeGiveaways.get(to);
    if (!d) return;
    const entrants = [...d.entrants];
    const winner = entrants[Math.floor(Math.random() * entrants.length)];
    activeGiveaways.delete(to);
    await reply(`🎉 Giveaway ended! Prize: ${d.prize}\nWinner: ${winner}`);
  }, seconds * 1000);

  await reply(`🎁 Giveaway started for ${seconds}s. Prize: ${prize}`);
}

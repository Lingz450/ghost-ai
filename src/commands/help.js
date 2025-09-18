export default async function help(_args, reply) {
  await reply(
`Commands:
!help
!alert <symbol> <price>
!alertlist
!alertreset [symbol]
!chart <symbol> [tf]
!ema <period> <tf>
!rsi <tf> <overbought|oversold>
!margin <cmp> <sl> <risk> <lev>
!pnl <pair> <entry> <exit> <size>
!wallet`
  );
}

export const fmt = {
  n(v, d = 2) { return Number(v).toLocaleString(undefined, { maximumFractionDigits: d }); },
  f(v, d = 2) { return Number(v).toFixed(d); }
};

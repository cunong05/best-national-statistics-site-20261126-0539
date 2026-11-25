// Number and value formatting for StatAtlas. Every figure on the site passes
// through here so large numbers read the same way on every page.

const nf = new Intl.NumberFormat('en-US');

export function fmtInt(n) {
  return nf.format(Math.round(n));
}

export function fmtMoney(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + fmtInt(n);
}

export function fmtCompact(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}

export function fmtPct(n, digits = 1) {
  return n.toFixed(digits) + '%';
}

export function fmtYears(n) {
  return n.toFixed(1) + ' yrs';
}

// The value of one indicator for one country in the snapshot year (2023).
// Population and GDP come from the 2023 entry of their 10-year series.
export function indicatorValue(country, key) {
  if (key === 'pop') return country.pop['2023'];
  if (key === 'gdp') return country.gdp['2023'];
  return country[key];
}

// Short display value for an indicator, with its unit.
export function indicatorDisplay(country, key) {
  const v = indicatorValue(country, key);
  switch (key) {
    case 'pop': return fmtCompact(v);
    case 'gdp': return fmtMoney(v);
    case 'gdppc': return fmtMoney(v);
    case 'life': return fmtYears(v);
    case 'unemp': case 'infl': case 'urban': case 'old': return fmtPct(v);
    case 'area': return fmtInt(v) + ' km²';
    case 'fert': return v.toFixed(2);
    default: return fmtInt(v);
  }
}

// Population density in people per sq km, derived from the 2023 figures.
export function density(country) {
  return country.pop['2023'] / country.area;
}

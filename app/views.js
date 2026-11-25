// HTML for every StatAtlas page, built from the data in data.js. Every value
// is escaped before it goes into the page, and every figure carries its source
// and year in the indicator table.

import { COUNTRIES, INDICATORS, YEAR } from './data.js';
import { barChart, columnChart, lineChart } from './charts.js';
import { density, fmtCompact, fmtInt, fmtMoney, fmtPct, indicatorDisplay, indicatorValue } from './format.js';

const esc = (s) => String(s).replace(/[&<>\"']/g, (c) => `&#${c.charCodeAt(0)};`);

const byCode = (code) => COUNTRIES.find((c) => c.code === code);

function nav(active) {
  const link = (href, label, key) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<nav class="topnav" aria-label="Main">
  ${link('#/', 'Home', 'home')}
  ${link('#/rankings', 'Rankings', 'rankings')}
  ${link('#/compare', 'Compare', 'compare')}
  ${link('#/about', 'About the data', 'about')}
</nav>`;
}

function countryCard(c) {
  const growth =
    ((c.pop['2023'] - c.pop['2014']) / c.pop['2014']) * 100;
  return `<article class="card">
  <h3><a href="#/country/${c.code}">${esc(c.name)}</a></h3>
  <p class="card-sub">${esc(c.region)} · Capital ${esc(c.capital)}</p>
  <dl class="card-stats">
    <div><dt>Population ${YEAR}</dt><dd>${fmtCompact(c.pop['2023'])}</dd></div>
    <div><dt>GDP ${YEAR}</dt><dd>${fmtMoney(c.gdp['2023'])}</dd></div>
    <div><dt>GDP / person</dt><dd>${fmtMoney(c.gdppc)}</dd></div>
    <div><dt>Life expectancy</dt><dd>${c.life.toFixed(1)} yrs</dd></div>
  </dl>
  <p class="card-note">Population ${growth >= 0 ? 'grew' : 'fell'} ${Math.abs(growth).toFixed(1)}% since 2014.</p>
  <p><a class="btn" href="#/country/${c.code}">Open profile →</a></p>
</article>`;
}

function kpi(label, value, note) {
  return `<div class="kpi"><span class="kpi-label">${esc(label)}</span>
  <span class="kpi-value">${esc(value)}</span>
  <span class="kpi-note">${esc(note)}</span></div>`;
}

export function home(query = '', region = 'All') {
  const totalPop = COUNTRIES.reduce((s, c) => s + c.pop['2023'], 0);
  const totalGdp = COUNTRIES.reduce((s, c) => s + c.gdp['2023'], 0);
  const byPop = [...COUNTRIES].sort((a, b) => b.pop['2023'] - a.pop['2023']);
  const byGdp = [...COUNTRIES].sort((a, b) => b.gdp['2023'] - a.gdp['2023']);
  const regions = ['All', ...new Set(COUNTRIES.map((c) => c.region))];
  const q = query.trim().toLowerCase();
  const shown = COUNTRIES.filter(
    (c) =>
      (region === 'All' || c.region === region) &&
      (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q),
  );
  const popRows = byPop.slice(0, 5).map((c) => ({
    label: c.name, value: c.pop['2023'], display: fmtCompact(c.pop['2023']),
  }));
  const gdpRows = byGdp.slice(0, 5).map((c) => ({
    label: c.name, value: c.gdp['2023'], display: fmtMoney(c.gdp['2023']),
  }));
  return `${nav('home')}
<section class="hero">
  <p class="eyebrow">National statistics · World Bank · ${YEAR}</p>
  <h1>Every country's numbers,<br>in one place.</h1>
  <p class="lede">StatAtlas gathers population, economy, health and demography for 12
  countries — from World Bank data, with the source and year on every figure —
  so you can look a country up, rank it, and compare it in seconds.</p>
  <div class="hero-kpis">
    ${kpi('Countries covered', String(COUNTRIES.length), 'Across 5 regions')}
    ${kpi('People counted', fmtCompact(totalPop), 'Combined population, ' + YEAR)}
    ${kpi('Combined GDP', fmtMoney(totalGdp), 'Current US$, ' + YEAR)}
  </div>
</section>
<section class="grid-2">
  <div class="panel">
    <h2>Largest populations, ${YEAR}</h2>
    ${barChart(popRows, { aria: 'Largest populations in 2023' })}
    <p class="panel-link"><a href="#/rankings?sort=pop">See the full population ranking →</a></p>
  </div>
  <div class="panel">
    <h2>Largest economies, ${YEAR}</h2>
    ${barChart(gdpRows, { aria: 'Largest economies in 2023', color: '#c98a1b' })}
    <p class="panel-link"><a href="#/rankings?sort=gdp">See the full GDP ranking →</a></p>
  </div>
</section>
<section class="panel">
  <h2>Browse countries</h2>
  <form class="filters" id="filters" action="#/" method="get">
    <label>Search <input type="search" id="q" name="q" value="${esc(query)}" placeholder="Type a country name…" autocomplete="off"></label>
    <label>Region
      <select id="region" name="region">
        ${regions.map((r) => `<option${r === region ? ' selected' : ''}>${esc(r)}</option>`).join('')}
      </select>
    </label>
  </form>
  <p class="result-count" id="result-count">${shown.length} of ${COUNTRIES.length} countries</p>
  <div class="cards" id="cards">
    ${shown.length ? shown.map(countryCard).join('\n') : '<p>No country matches that search. <a href="#/">Clear the filters</a>.</p>'}
  </div>
</section>
<section class="panel">
  <h2>Fastest growing populations, 2014–2023</h2>
  <p>${topGrowers()}</p>
  <p class="panel-link"><a href="#/rankings?sort=pop">Rank all countries →</a> · <a href="#/compare">Compare any three →</a></p>
</section>`;
}

function topGrowers() {
  const rows = [...COUNTRIES]
    .map((c) => ({ c, g: ((c.pop['2023'] - c.pop['2014']) / c.pop['2014']) * 100 }))
    .sort((a, b) => b.g - a.g)
    .slice(0, 3);
  return rows
    .map(
      (r, i) =>
        `${i + 1}. <a href="#/country/${r.c.code}">${esc(r.c.name)}</a> — population up ${r.g.toFixed(1)}% in ten years`,
    )
    .join('<br>');
}

export function country(code) {
  const c = byCode(code);
  if (!c) return missing();
  const popPoints = Object.entries(c.pop).map(([year, value]) => ({ year: Number(year), value }));
  const gdpPoints = Object.entries(c.gdp).map(([year, value]) => ({
    year: Number(year), value, display: fmtMoney(value),
  }));
  const popGrowth = ((c.pop['2023'] - c.pop['2014']) / c.pop['2014']) * 100;
  const gdpGrowth = ((c.gdp['2023'] - c.gdp['2014']) / c.gdp['2014']) * 100;
  const rankPop = [...COUNTRIES].sort((a, b) => b.pop['2023'] - a.pop['2023']).findIndex((x) => x.code === code) + 1;
  const rankGdp = [...COUNTRIES].sort((a, b) => b.gdp['2023'] - a.gdp['2023']).findIndex((x) => x.code === code) + 1;
  const rows = INDICATORS.map(
    (ind) => `<tr><th scope="row">${esc(ind.label)}</th>
    <td>${esc(indicatorDisplay(c, ind.key))}</td>
    <td>${esc(ind.unit)}</td><td>${ind.year}</td><td>${esc(ind.source)}</td></tr>`,
  ).join('\n');
  const others = COUNTRIES.filter((x) => x.code !== code)
    .slice(0, 4)
    .map((x) => `<a href="#/country/${x.code}">${esc(x.name)}</a>`)
    .join(' · ');
  return `${nav('')}
<p class="crumbs"><a href="#/">← All countries</a></p>
<header class="country-head">
  <p class="eyebrow">${esc(c.region)} · ${esc(c.code)}</p>
  <h1>${esc(c.name)}</h1>
  <p class="lede">Capital ${esc(c.capital)} · Currency ${esc(c.currency)} · Official language: ${esc(c.language)}.
  Population density ${fmtInt(density(c))} people per km².</p>
</header>
<div class="kpis">
  ${kpi('Population ' + YEAR, fmtInt(c.pop['2023']), '#' + rankPop + ' of ' + COUNTRIES.length + ' · ' + (popGrowth >= 0 ? '+' : '') + popGrowth.toFixed(1) + '% since 2014')}
  ${kpi('GDP ' + YEAR, fmtMoney(c.gdp['2023']), '#' + rankGdp + ' of ' + COUNTRIES.length + ' · ' + (gdpGrowth >= 0 ? '+' : '') + gdpGrowth.toFixed(1) + '% since 2014')}
  ${kpi('GDP per person', fmtMoney(c.gdppc), 'Current US$, ' + YEAR)}
  ${kpi('Life expectancy', c.life.toFixed(1) + ' years', 'At birth, ' + YEAR)}
  ${kpi('Unemployment', fmtPct(c.unemp), 'Modelled ILO estimate, ' + YEAR)}
  ${kpi('Inflation', fmtPct(c.infl), 'Consumer prices, ' + YEAR)}
</div>
<section class="grid-2">
  <div class="panel">
    <h2>Population, 2014–2023</h2>
    ${lineChart(popPoints, { aria: 'Population of ' + c.name + ' 2014 to 2023', formatTick: (v) => fmtCompact(v) })}
    <p class="chart-note">Total population, World Bank SP.POP.TOTL.</p>
  </div>
  <div class="panel">
    <h2>GDP, 2014–2023</h2>
    ${columnChart(gdpPoints, { aria: 'GDP of ' + c.name + ' 2014 to 2023' })}
    <p class="chart-note">GDP in current US$, World Bank NY.GDP.MKTP.CD.</p>
  </div>
</section>
<section class="panel">
  <h2>All indicators, ${YEAR}</h2>
  <div class="table-wrap"><table class="data-table">
    <thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Unit</th><th scope="col">Year</th><th scope="col">Source</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  <p class="chart-note">Figures are rounded for display. Full precision lives in the data file; see <a href="#/about">About the data</a>.</p>
</section>
<section class="panel">
  <h2>Compare ${esc(c.name)}</h2>
  <p><a class="btn" href="#/compare?a=${c.code}">Compare with other countries →</a></p>
  <p class="chart-note">Also explore: ${others}</p>
</section>`;
}

export function rankings(sortKey = 'pop', dir = 'desc') {
  const valid = INDICATORS.map((i) => i.key);
  const key = valid.includes(sortKey) ? sortKey : 'pop';
  const ind = INDICATORS.find((i) => i.key === key);
  const sorted = [...COUNTRIES].sort((a, b) => {
    const d = indicatorValue(b, key) - indicatorValue(a, key);
    return dir === 'asc' ? -d : d;
  });
  const short = { pop: 'Population', gdp: 'GDP', gdppc: 'GDP / cap.', life: 'Life exp.', unemp: 'Unemploy.', infl: 'Inflation', area: 'Land area', urban: 'Urban %', fert: 'Fertility', old: 'Age 65+' };
  const head = INDICATORS.map((i) => {
    const nextDir = i.key === key && dir === 'desc' ? 'asc' : 'desc';
    const arrow = i.key === key ? (dir === 'desc' ? ' ▼' : ' ▲') : '';
    return `<th scope="col"><a href="#/rankings?sort=${i.key}&dir=${nextDir}">${esc(short[i.key])}${arrow}</a></th>`;
  }).join('');
  const rows = sorted
    .map(
      (c, i) => `<tr><td>${i + 1}</td>
      <th scope="row"><a href="#/country/${c.code}">${esc(c.name)}</a></th>
      ${INDICATORS.map((ind2) => `<td${ind2.key === key ? ' class="sorted-col"' : ''}>${esc(indicatorDisplay(c, ind2.key))}</td>`).join('')}
    </tr>`,
    )
    .join('\n');
  return `${nav('rankings')}
<h1>Rankings</h1>
<p class="lede">All ${COUNTRIES.length} countries, ranked by any indicator. Click a column heading
to sort by it; click again to reverse the order. All figures are for ${YEAR} unless noted.</p>
<div class="table-wrap"><table class="data-table rankings-table">
  <thead><tr><th scope="col">#</th><th scope="col">Country</th>${head}</tr></thead>
  <tbody>${rows}</tbody>
</table></div>
<p class="chart-note">Currently sorted by ${esc(ind.label)} (${dir === 'desc' ? 'highest first' : 'lowest first'}).
Source: World Bank, World Development Indicators, ${YEAR}. See <a href="#/about">About the data</a> for definitions.</p>`;
}

export function compare(a, b, cc) {
  const picked = [a, b, cc].map(byCode).filter(Boolean);
  const options = COUNTRIES.map(
    (c) => `<option value="${c.code}">${esc(c.name)}</option>`,
  ).join('');
  const selects = [0, 1, 2]
    .map((i) => {
      const sel = picked[i];
      const opts = COUNTRIES.map(
        (c) => `<option value="${c.code}"${sel && sel.code === c.code ? ' selected' : ''}>${esc(c.name)}</option>`,
      ).join('');
      return `<label>Country ${i + 1}
      <select class="compare-select" data-slot="${i}">${opts}</select></label>`;
    })
    .join('');
  let body = '';
  if (picked.length < 2) {
    body = `<p class="lede">Pick two or three countries to compare them side by side.</p>`;
  } else {
    const popRows = picked.map((c) => ({
      label: c.name, value: c.pop['2023'], display: fmtCompact(c.pop['2023']),
    }));
    const gdpRows = picked.map((c) => ({
      label: c.name, value: c.gdp['2023'], display: fmtMoney(c.gdp['2023']),
    }));
    const lifeRows = picked.map((c) => ({
      label: c.name, value: c.life, display: c.life.toFixed(1) + ' yrs',
    }));
    const tableRows = INDICATORS.map(
      (ind) =>
        `<tr><th scope="row">${esc(ind.label)}<br><span class="unit">${esc(ind.unit)}</span></th>${picked
          .map((c) => `<td>${esc(indicatorDisplay(c, ind.key))}</td>`)
          .join('')}</tr>`,
    ).join('\n');
    body = `<div class="grid-2">
  <div class="panel"><h2>Population, ${YEAR}</h2>${barChart(popRows, { aria: 'Population comparison' })}</div>
  <div class="panel"><h2>GDP, ${YEAR}</h2>${barChart(gdpRows, { aria: 'GDP comparison', color: '#c98a1b' })}</div>
</div>
<div class="panel"><h2>Life expectancy, ${YEAR}</h2>${barChart(lifeRows, { aria: 'Life expectancy comparison', color: '#3d6b8e' })}</div>
<div class="panel"><h2>Side by side, ${YEAR}</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th scope="col">Indicator</th>${picked.map((c) => `<th scope="col"><a href="#/country/${c.code}">${esc(c.name)}</a></th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody>
</table></div>
<p class="chart-note">Source: World Bank, World Development Indicators, ${YEAR}.</p></div>`;
  }
  return `${nav('compare')}
<h1>Compare countries</h1>
<form class="compare-form" id="compare-form">
  ${selects}
  <button class="btn" type="submit">Compare</button>
</form>
${body}`;
}

export function about() {
  return `${nav('about')}
<h1>About the data</h1>
<p class="lede">StatAtlas is an independent statistics explorer. It is not affiliated with
the World Bank or any government. Every figure on this site comes from the World Bank's
World Development Indicators, retrieved from the public World Bank API on 26 November 2026,
and every indicator table names its source code and year.</p>
<section class="panel">
  <h2>What is covered</h2>
  <ul>
    <li><strong>12 countries</strong> across Asia, Europe, North America, South America and Africa,
    chosen to span the world's largest populations and economies.</li>
    <li><strong>10 indicators</strong>: population, GDP, GDP per capita, life expectancy,
    unemployment, inflation, land area, urban share, fertility rate and population aged 65+.</li>
    <li><strong>Ten-year series, 2014–2023</strong>, for population and GDP on every country page.</li>
    <li><strong>2023 is the snapshot year</strong> for every indicator, because it is the latest year
    with complete World Bank data for all 12 countries.</li>
  </ul>
</section>
<section class="panel">
  <h2>Sources</h2>
  <div class="table-wrap"><table class="data-table">
    <thead><tr><th scope="col">Indicator</th><th scope="col">World Bank code</th><th scope="col">Year</th></tr></thead>
    <tbody>${INDICATORS.map((i) => `<tr><td>${esc(i.label)}</td><td>${esc(i.source)}</td><td>${i.year}</td></tr>`).join('')}</tbody>
  </table></div>
  <p>World Bank Open Data: <span class="mono">api.worldbank.org</span>. Population and GDP series
  cover 2014–2023. Figures are rounded for display; the data file keeps full precision.</p>
</section>
<section class="panel">
  <h2>How to use this site</h2>
  <ul>
    <li><strong>Home</strong> — the biggest populations and economies at a glance, then browse or search all countries.</li>
    <li><strong>Country pages</strong> — six headline numbers, ten-year population and GDP charts, and the full indicator table with sources.</li>
    <li><strong>Rankings</strong> — sort all 12 countries by any indicator.</li>
    <li><strong>Compare</strong> — put two or three countries side by side, with charts and a full table.</li>
  </ul>
  <p>This site works entirely offline: all data and code are files in this site, and nothing is
  fetched from another origin. It runs on a desktop and on a phone.</p>
</section>`;
}

export function missing() {
  return `${nav('')}
<h1>Not found</h1>
<p class="lede">There is no page at this address.</p>
<p><a class="btn" href="#/">Back to Home →</a></p>`;
}

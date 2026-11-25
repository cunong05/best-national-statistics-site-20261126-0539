// StatAtlas router: hash routes, no network, no build step.
//
//   #/                          home (search + region filter, live)
//   #/country/<CODE>            one country's profile
//   #/rankings?sort=<key>&dir=  sortable table of all countries
//   #/compare?a=<CODE>&b=<CODE> side-by-side comparison
//   #/about                     sources and method
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { about, compare, country, home, missing, rankings } from './views.js';

const app = document.getElementById('app');

// Home filter state, kept across re-renders while the visitor types.
let homeQuery = '';
let homeRegion = 'All';

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const [pathPart, queryPart] = raw.split('?');
  const params = new URLSearchParams(queryPart ?? '');
  return { path: pathPart || '/', params };
}

function wireHome() {
  const q = document.getElementById('q');
  const region = document.getElementById('region');
  const form = document.getElementById('filters');
  if (!q || !region) return;
  q.value = homeQuery;
  region.value = homeRegion;
  const rerender = () => {
    homeQuery = q.value;
    homeRegion = region.value;
    render(true);
  };
  q.addEventListener('input', rerender);
  region.addEventListener('change', rerender);
  form?.addEventListener('submit', (e) => e.preventDefault());
}

function wireCompare() {
  const form = document.getElementById('compare-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picks = [...form.querySelectorAll('.compare-select')].map((s) => s.value);
    location.hash = `#/compare?a=${picks[0]}&b=${picks[1]}&c=${picks[2]}`;
  });
}

function render(keepFocus = false) {
  window.__shotReady = false;
  const { path, params } = parseHash();
  const active = document.activeElement;
  const focusId = keepFocus && active?.id ? active.id : null;
  const focusValue = keepFocus && active?.value !== undefined ? active.value : null;
  const focusSel = keepFocus && active?.selectionStart !== undefined ? active.selectionStart : null;

  if (path === '/') {
    document.title = 'StatAtlas — National Statistics Explorer';
    app.innerHTML = home(homeQuery, homeRegion);
    wireHome();
  } else if (path.startsWith('/country/')) {
    const code = decodeURIComponent(path.slice('/country/'.length)).toUpperCase();
    document.title = `${code} | StatAtlas`;
    app.innerHTML = country(code);
  } else if (path === '/rankings') {
    document.title = 'Rankings | StatAtlas';
    app.innerHTML = rankings(params.get('sort') ?? 'pop', params.get('dir') ?? 'desc');
  } else if (path === '/compare') {
    document.title = 'Compare countries | StatAtlas';
    app.innerHTML = compare(
      params.get('a') ?? 'IDN',
      params.get('b') ?? 'USA',
      params.get('c') ?? 'JPN',
    );
    wireCompare();
  } else if (path === '/about') {
    document.title = 'About the data | StatAtlas';
    app.innerHTML = about();
  } else {
    document.title = 'Not found | StatAtlas';
    app.innerHTML = missing();
  }

  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      if (focusValue !== null) el.value = focusValue;
      if (focusSel !== null && el.setSelectionRange) {
        try { el.setSelectionRange(focusSel, focusSel); } catch { /* input type may not support it */ }
      }
    }
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', () => render());
render();

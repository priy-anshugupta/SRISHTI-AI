const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadSource(file, globals, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => imports[name], AbortController, ...globals });
  return exports;
}

function browser(visibilityState = 'visible') {
  const document = new EventTarget();
  document.visibilityState = visibilityState;
  const window = new EventTarget();
  window.location = { hostname: 'localhost', origin: 'http://localhost:3000' };
  return {
    document, window,
    visibility(state) {
      document.visibilityState = state;
      document.dispatchEvent(new Event('visibilitychange'));
    },
    page(event) { window.dispatchEvent(new Event(event)); },
  };
}

function scheduler(visibilityState) {
  const env = browser(visibilityState);
  let now = 0;
  let id = 0;
  const timers = new Map();
  const { startVisiblePolling } = loadSource('lib/visiblePolling.ts', {
    ...env,
    setTimeout: (callback, delay) => { timers.set(++id, { callback, due: now + delay }); return id; },
    clearTimeout: key => timers.delete(key),
  });
  return {
    ...env, startVisiblePolling, timers,
    async tick(ms) {
      now += ms;
      for (const [key, timer] of [...timers]) {
        if (timer.due <= now) { timers.delete(key); timer.callback(); }
      }
      // Flush promises across the isolated browser VM before advancing time.
      await new Promise(resolve => setImmediate(resolve));
    },
  };
}

test('polls immediately when opened and repeats only at 30 or 60 seconds', async () => {
  for (const interval of [30_000, 60_000]) {
    const env = scheduler();
    let requests = 0;
    const stop = env.startVisiblePolling(async () => { requests++; }, interval);
    await env.tick(0);
    assert.equal(requests, 1);
    await env.tick(interval - 1);
    assert.equal(requests, 1);
    await env.tick(1);
    assert.equal(requests, 2);
    stop();
    await env.tick(interval * 10);
    assert.equal(requests, 2);
    assert.equal(env.timers.size, 0);
  }
});

test('an initially hidden tab does not contact the backend; showing it refreshes', async () => {
  const env = scheduler('hidden');
  let requests = 0;
  const stop = env.startVisiblePolling(async () => { requests++; }, 30_000);
  await env.tick(300_000);
  assert.equal(requests, 0);
  env.visibility('visible');
  await env.tick(0);
  assert.equal(requests, 1);
  env.visibility('hidden');
  await env.tick(300_000);
  assert.equal(requests, 1);
  env.visibility('visible');
  assert.equal(requests, 2);
  stop();
});

test('slow cold starts never queue requests and hidden tabs abort in-flight work', async () => {
  const env = scheduler();
  const requests = [];
  const stop = env.startVisiblePolling(signal => new Promise(resolve => requests.push({ signal, resolve })), 30_000);
  await env.tick(300_000);
  assert.equal(requests.length, 1);
  assert.equal(env.timers.size, 0);
  env.visibility('hidden');
  assert.equal(requests[0].signal.aborted, true);
  env.visibility('visible');
  assert.equal(requests.length, 2);
  requests[0].resolve();
  await env.tick(0);
  assert.equal(env.timers.size, 0, 'a stale response must not restart its timer');
  stop();
  assert.equal(requests[1].signal.aborted, true);
  requests[1].resolve();
  await env.tick(300_000);
  assert.equal(requests.length, 2);
});

test('page exit suspends polling and a back/forward cache restore resumes it', async () => {
  const env = scheduler();
  let requests = 0;
  const stop = env.startVisiblePolling(async () => { requests++; }, 60_000);
  await env.tick(0);
  env.page('pagehide');
  await env.tick(600_000);
  assert.equal(requests, 1);
  env.page('pageshow');
  await env.tick(0);
  assert.equal(requests, 2);
  stop();
  env.page('pageshow');
  env.visibility('visible');
  assert.equal(requests, 2, 'cleanup must remove all resume listeners');
});

test('failed requests retry at the normal interval', async () => {
  const env = scheduler();
  let requests = 0;
  const stop = env.startVisiblePolling(async () => { requests++; throw new Error('Backend waking'); }, 30_000);
  await env.tick(0);
  await env.tick(29_999);
  assert.equal(requests, 1);
  await env.tick(1);
  assert.equal(requests, 2);
  stop();
});

function telemetryProvider(route, authenticated = true, visibility = 'visible') {
  const env = browser(visibility);
  const effects = [];
  const polls = [];
  const sockets = [];
  const requests = [];
  const react = {
    createContext: () => ({ Provider: {} }), useContext: () => ({}),
    useState: value => [value, () => {}], useRef: value => ({ current: value }),
    useCallback: callback => callback, useEffect: effect => effects.push(effect),
  };
  class WebSocket {
    static OPEN = 1;
    constructor() { sockets.push(this); }
    close() { this.closed = true; }
  }
  const { TelemetryProvider } = loadSource('context/TelemetryContext.tsx', {
    ...env, WebSocket, process: { env: {} },
  }, {
    react, 'react/jsx-runtime': { jsx: () => null },
    'next/navigation': { usePathname: () => route },
    '@/context/AuthContext': { useAuth: () => ({ isAuthenticated: authenticated, isLoading: false }) },
    '@/lib/api': { api: async (url, init) => { requests.push({ url, init }); return {}; } },
    '@/lib/useDashboardPolling': { useDashboardPolling: (...args) => polls.push(args) },
    '@/lib/visiblePolling': { ALERTS_POLL_MS: 60_000, TELEMETRY_POLL_MS: 30_000 },
  });
  TelemetryProvider({ children: null });
  const cleanup = effects.map(effect => effect()).filter(Boolean);
  return { ...env, polls, sockets, requests, stop: () => cleanup.forEach(fn => fn()) };
}

test('public, historical and tool pages and signed-out dashboards start no telemetry work', () => {
  for (const route of ['/', '/login', '/map', '/analytics', '/ask', '/ingest', '/review', '/report', '/compare', '/knowledge', '/well/MOR-07']) {
    const env = telemetryProvider(route);
    assert.equal(env.sockets.length, 0, route);
    assert.ok(env.polls.every(([, , enabled]) => !enabled), route);
    env.stop();
  }
  const env = telemetryProvider('/doghouse', false);
  assert.equal(env.sockets.length, 0);
  assert.ok(env.polls.every(([, , enabled]) => !enabled));
});

test('dashboard streams close when hidden or exited, and reconnect on return', () => {
  for (const route of ['/doghouse', '/alerts', '/well/MOR-29']) {
    const env = telemetryProvider(route);
    assert.ok(env.polls.every(([, , enabled, key]) => enabled && key === route));
    assert.equal(env.sockets.length, 1);
    env.visibility('hidden');
    assert.equal(env.sockets[0].closed, true);
    assert.equal(env.sockets[0].onclose, null, 'intentional close must not restart work');
    env.visibility('visible');
    assert.equal(env.sockets.length, 2);
    env.page('pagehide');
    assert.equal(env.sockets[1].closed, true);
    env.page('pageshow');
    assert.equal(env.sockets.length, 3);
    env.stop();
    assert.equal(env.sockets[2].closed, true);
    env.visibility('visible');
    assert.equal(env.sockets.length, 3);
  }
  const hidden = telemetryProvider('/doghouse', true, 'hidden');
  assert.equal(hidden.sockets.length, 0);
  hidden.stop();
});

test('healthy streams suppress duplicate HTTP requests and failed streams use the fallback', async () => {
  const env = telemetryProvider('/doghouse');
  const [poll, interval] = env.polls.find(([, interval]) => interval === 30_000);
  assert.equal(interval, 30_000);
  env.sockets[0].readyState = 1;
  await poll(new AbortController().signal);
  assert.equal(env.requests.length, 0);
  env.sockets[0].onclose();
  const controller = new AbortController();
  await poll(controller.signal);
  assert.equal(env.requests.length, 1);
  assert.equal(env.requests[0].url, '/api/telemetry/current');
  assert.equal(env.requests[0].init.signal, controller.signal);
  env.stop();
});

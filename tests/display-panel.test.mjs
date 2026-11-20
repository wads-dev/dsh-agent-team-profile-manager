import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots';

const footer = 'conversation.session.header.actions.subagent.footer';
const action = 'conversation.session.header.actions';

test('rc.4 real catalog renders complementary persisted aliases without replacing native navigation', async t => {
  const dom = new JSDOM('<html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost' });
  const globals = ['window', 'document', 'HTMLElement', 'getComputedStyle', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
    getComputedStyle: dom.window.getComputedStyle, IS_REACT_ACT_ENVIRONMENT: true });
  let root;
  t.after(async () => {
    if (root) await React.act(async () => root.unmount());
    dom.window.close();
    for (const key of globals) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
    }
  });
  root = createRoot(document.getElementById('root'));
  const slots = new SlotCore();
  slots.register({ name: 'root', children: {
    [action]: { kind: 'list', scope: 'session' },
    'conversation.session.header.lineage': { kind: 'single', scope: 'session' },
    'conversation.composer': { kind: 'chain', scope: 'session' },
  } }, () => null);
  const calls = [];
  const values = { agentTeam: { enabled: true, tasks: [] }, agentTeamDisplayNames: { child: 'Backend — Revisão', orphan: 'Not in catalog' },
    subagentCatalog: [{ id: 'child', name: 'backend', label: 'Native backend', mode: 'continuable' }] };
  const state = { byId: { child: { running: false } }, projectionsBySession: {
    lead: { state: 'ready', values }, child: { state: 'ready', values: { subagentCatalog: [] } },
  } };
  const dictionaries = new Map([['agent-team', {}]]);
  const disposers = [];
  const ctx = {
    slots: { entries: name => slots.entries(name), subscribe: (name, fn) => slots.subscribe(name, fn),
      inject: (_name, callback) => callback(), register: (spec, component) => {
        const dispose = slots.register(spec, component); disposers.push(dispose); return dispose;
      } },
    locale: { register: (ns, dict) => {
      assert.equal(dictionaries.has(ns), false, 'unique locale namespace'); dictionaries.set(ns, dict);
      return () => dictionaries.delete(ns);
    }, bind: ns => key => dictionaries.get(ns)?.en?.[key] ?? key },
    effect: callback => { const dispose = callback(); disposers.push(dispose); },
    inject: () => {}, // Sidebar resource service is outside this focused catalog fixture.
    uiWorkspace: { openSession: address => calls.push(address) }, sidebarRight: { openResource: () => {} },
    sessions: { refreshProjections: async () => {}, list: { getSnapshot: () => state } },
  };
  const MenuSurface = React.forwardRef(({ children, ...props }, ref) => React.createElement('div', { ...props, ref }, children));
  const primitives = new Proxy({ MenuSurface, Tooltip: ({ children }) => children }, { get: (object, key) => object[key] ?? (() => null) });
  const modules = { react: React, 'react/jsx-runtime': jsx, 'react-dom': ReactDOM,
    '@deepseek-ai/dsh-client-ui-primitives': primitives };
  async function load(path) {
    let result;
    vm.runInNewContext(await readFile(new URL(path, import.meta.url), 'utf8'), {
      window: { __ModuleLoader__: { load: spec => { result = spec.factory(name => {
        assert.ok(modules[name], 'declared browser module: ' + name); return modules[name];
      }); } } }, document, getComputedStyle, setTimeout, clearTimeout, queueMicrotask, console, URLSearchParams,
    });
    return result;
  }
  const upstream = await load('../node_modules/@deepseek-ai/dsh-client-ui-subagent/lib/client.js');
  upstream.apply(ctx);
  const native = slots.entriesOfSlot(action)[0];
  assert.equal(native.options.id, 'subagent-catalog');
  const aliases = await load('../lib/client.js');
  const ownDisposersStart = disposers.length;
  aliases.apply(ctx);
  assert.equal(slots.entriesOfSlot(action).length, 1);
  assert.equal(slots.entriesOfSlot(action)[0].component, native.component);
  assert.equal(slots.entriesOfSlot(footer).length, 1);
  const nativeInject = native.inject('lead');
  const standard = { sessionId: 'lead', useSession: selector => selector({ subagent: null }),
    useSessions: selector => selector(state), useProjection: (key, selector) => selector(values[key]),
    useSessionStatus: selector => selector(new Map()), useFooterAvailable: selector => selector(true) };
  const render = () => React.createElement(native.component, { ...standard, ...nativeInject,
    t: ctx.locale.bind('subagent'), renderSlot: name => slots.entriesOfSlot(name).map(entry => React.createElement(entry.component,
      { key: entry.options.id, ...standard, t: ctx.locale.bind(entry.locale) })) });
  await React.act(async () => root.render(render()));
  await React.act(async () => document.querySelector('button').click());
  const panel = () => document.querySelector('[data-agent-team-aliases]');
  assert.ok(document.querySelector('[data-subagent-panel]'));
  assert.ok(panel().textContent.includes('Backend — Revisão'));
  assert.ok(panel().textContent.includes('backend · child'));
  assert.equal(panel().textContent.includes('Not in catalog'), false);
  assert.equal(panel().querySelectorAll('button,a').length, 0, 'footer does not claim native navigation');
  values.agentTeamDisplayNames = { child: '<img src=x onerror=alert(1)> ADMIN — Ágil' };
  await React.act(async () => root.render(render()));
  assert.ok(panel().textContent.includes('<img src=x onerror=alert(1)> ADMIN — Ágil'));
  assert.equal(panel().querySelector('img'), null, 'aliases render as React text');
  assert.equal(values.subagentCatalog[0].name, 'backend');
  assert.equal(values.subagentCatalog[0].label, 'Native backend');
  const nativeRow = document.querySelector('[role="treeitem"]');
  assert.ok(nativeRow.textContent.includes('Native backend'));
  await React.act(async () => nativeRow.click());
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { parentSessionId: 'lead', childSessionId: 'child', mode: 'continuable' });
  await React.act(async () => document.querySelector('button').click());
  values.agentTeamDisplayNames = {};
  await React.act(async () => root.render(render()));
  assert.equal(panel(), null, 'reset removes aliases without touching catalog');
  assert.equal(slots.entriesOfSlot(action)[0].component, native.component);
  for (const dispose of disposers.splice(ownDisposersStart).reverse()) dispose?.();
  assert.equal(slots.entriesOfSlot(footer).length, 0, 'plugin unload removes only its footer');
  assert.equal(slots.entriesOfSlot(action)[0].component, native.component);
  assert.equal(dictionaries.has('agent-team-profile-aliases'), false);
  for (const dispose of disposers.reverse()) dispose?.();
});

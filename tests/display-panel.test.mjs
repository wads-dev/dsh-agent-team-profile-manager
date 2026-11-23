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
import * as clientStore from '@deepseek-ai/dsh-client-store';

const section = 'conversation.session.panel.section';

test('0.2.3-alpha.2 alias section joins the official Session panel beside native subagents without replacing navigation', async t => {
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
    [section]: { kind: 'list', scope: 'session' },
    'conversation.session.panel.section.actions': { kind: 'keyed', scope: 'session' },
    'conversation.session.panel.indicator': { kind: 'list', scope: 'session', inline: true },
    'conversation.session.header.lineage': { kind: 'single', scope: 'session' },
    'conversation.composer': { kind: 'chain', scope: 'session' },
  } }, () => null);
  const calls = [];
  const values = { agentTeam: { enabled: true, tasks: [] }, agentTeamDisplayNames: { child: 'Backend — Revisão', orphan: 'Not in catalog' },
    subagentCatalog: [{ id: 'child', name: 'backend', label: 'Native backend', mode: 'continuable', activity: 'inactive', createdAt: 1 }] };
  let state = { byId: { child: { running: false } }, projectionsBySession: {
    lead: { state: 'ready', values }, child: { state: 'ready', values: { subagentCatalog: [] } },
  } };
  const setValues = next => { state = { ...state, projectionsBySession: { ...state.projectionsBySession, lead: { state: 'ready', values: next } } }; };
  const dictionaries = new Map();
  const disposers = [];
  const ctx = {
    slots: { entries: name => slots.entries(name), subscribe: (name, fn) => slots.subscribe(name, fn),
      inject: (_name, callback) => { const out = callback(); if (out && typeof out.next === 'function') { for (const d of out) disposers.push(d); } else disposers.push(out); },
      register: (spec, component) => slots.register(spec, component) },
    locale: { register: (ns, dict) => {
      assert.equal(dictionaries.has(ns), false, 'unique locale namespace'); dictionaries.set(ns, dict);
      return () => dictionaries.delete(ns);
    }, bind: ns => key => dictionaries.get(ns)?.en?.[key] ?? key },
    effect: callback => { const dispose = callback(); disposers.push(dispose); },
    inject: () => {}, // Sidebar resource service is outside this focused panel fixture.
    uiWorkspace: { openSession: address => calls.push(address) }, sidebarRight: { openResource: () => {} },
    sessions: { refreshProjections: async () => {}, list: { getSnapshot: () => state } },
  };
  const MenuSurface = React.forwardRef(({ children, ...props }, ref) => React.createElement('div', { ...props, ref }, children));
  const passthrough = ({ children }) => children ?? null;
  const primitives = new Proxy({ MenuSurface, Tooltip: passthrough, HoverCardGroup: passthrough, HoverCard: ({ anchor, children }) => anchor ?? children ?? null },
    { get: (object, key) => object[key] ?? passthrough });
  const modules = { react: React, 'react/jsx-runtime': jsx, 'react-dom': ReactDOM,
    '@deepseek-ai/dsh-client-ui-primitives': primitives, '@deepseek-ai/dsh-client-store': clientStore };
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
  const byId = id => slots.entriesOfSlot(section).find(entry => entry.options.id === id);
  const native = byId('subagents');
  assert.ok(native, 'native subagents section registered');
  assert.equal(native.options.order, 200);
  const nativeCount = slots.entriesOfSlot(section).length;
  const aliases = await load('../lib/client.js');
  const ownDisposersStart = disposers.length;
  aliases.apply(ctx);
  const own = byId('agent-team-profile-aliases');
  assert.ok(own, 'alias section registered in the official Session panel slot');
  assert.equal(own.options.order, 210, 'after subagents (200), before shared tasks (250)');
  assert.equal(own.options.label(), 'Display aliases');
  assert.equal(slots.entriesOfSlot(section).length, nativeCount + 1);
  assert.equal(byId('subagents').component, native.component, 'native section unchanged');
  const standard = () => ({ sessionId: 'lead', useSessions: selector => selector(state),
    useSessionStatus: selector => selector(new Map()), dismissOverlay: () => {} });
  const nativeStore = native.options.store;
  const nativeProps = () => ({ ...standard(), ...native.inject('lead'), t: ctx.locale.bind(native.options.locale),
    useStore: selector => selector({ unfolded: false }), actions: { unfoldedSet: () => {} }, renderFactorySlot: () => null });
  const render = () => React.createElement(React.Fragment, null,
    React.createElement(native.component, nativeProps()),
    React.createElement(own.component, { ...standard(), t: ctx.locale.bind(own.options.locale) }));
  await React.act(async () => root.render(render()));
  const panel = () => document.querySelector('[data-agent-team-aliases]');
  assert.ok(document.querySelector('[data-subagents-section]'), 'native section renders');
  assert.ok(panel().textContent.includes('Backend — Revisão'));
  assert.ok(panel().textContent.includes('backend · child'));
  assert.equal(panel().textContent.includes('Not in catalog'), false);
  assert.equal(panel().querySelectorAll('button,a').length, 0, 'alias section does not claim native navigation');
  setValues({ ...values, agentTeamDisplayNames: { child: '<img src=x onerror=alert(1)> ADMIN — Ágil' } });
  await React.act(async () => root.render(render()));
  assert.ok(panel().textContent.includes('<img src=x onerror=alert(1)> ADMIN — Ágil'));
  assert.equal(panel().querySelector('img'), null, 'aliases render as React text');
  assert.equal(values.subagentCatalog[0].name, 'backend');
  const nativeRow = document.querySelector('[data-subagents-section] [role="treeitem"]');
  assert.ok(nativeRow, 'native catalog row rendered');
  assert.ok(nativeRow.textContent.includes('Native backend') || nativeRow.textContent.includes('backend'));
  await React.act(async () => nativeRow.click());
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { parentSessionId: 'lead', childSessionId: 'child', mode: 'continuable' });
  setValues({ ...values, agentTeamDisplayNames: {} });
  await React.act(async () => root.render(render()));
  assert.equal(panel(), null, 'reset removes aliases without touching catalog');
  assert.ok(document.querySelector('[data-subagents-section]'));
  for (const dispose of disposers.splice(ownDisposersStart).reverse()) dispose?.();
  assert.equal(byId('agent-team-profile-aliases'), undefined, 'plugin unload removes only its section');
  assert.equal(byId('subagents').component, native.component);
  assert.equal(dictionaries.has('agent-team-profile-aliases'), false);
  for (const dispose of disposers.reverse()) dispose?.();
  void nativeStore;
});

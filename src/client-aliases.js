/** Complementary rc.2 catalog footer. Native navigation and transport stay upstream-owned. */
window.__ModuleLoader__.load({
  id: 'dsh-agent-team-profile-manager',
  factory: require => {
    const { createElement: h } = require('react');
    const footer = 'conversation.session.header.actions.subagent.footer';
    const namespace = 'agent-team-profile-aliases';
    function AliasPanel({ useProjection, t }) {
      const aliases = useProjection('agentTeamDisplayNames', value => value);
      const catalog = useProjection('subagentCatalog', value => value);
      // Never resolve by alias/name: the persisted projection is keyed by durable Session ID.
      const entries = (catalog ?? []).filter(entry => Object.hasOwn(aliases ?? {}, entry.id));
      if (entries.length === 0) return null;
      return h('section', {
        'data-agent-team-aliases': '', 'aria-label': t('title'),
        style: { borderTop: '1px solid var(--dsw-alias-border-main)', padding: '10px 12px', fontSize: '12px' },
      },
      h('h3', { style: { margin: '0 0 6px', fontSize: '12px' } }, t('title')),
      h('p', { style: { margin: '0 0 8px', color: 'var(--dsw-alias-label-tertiary)' } }, t('help')),
      h('dl', { style: { margin: 0 } }, entries.map(entry => h('div', { key: entry.id, style: { marginBottom: '8px', overflowWrap: 'anywhere' } },
        h('dt', { style: { fontWeight: 600, unicodeBidi: 'plaintext' } }, aliases[entry.id]),
        h('dd', { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)' } },
          h('span', null, entry.name ?? entry.id), ' · ', h('code', null, entry.id)),
      ))));
    }
    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(namespace, {
          en: { title: 'Display aliases', help: 'Visual labels only. Use the catalog above to navigate; tool targets are unchanged.' },
          pt: { title: 'Aliases visuais', help: 'Apenas rótulos visuais. Navegue pelo catálogo acima; os alvos das ferramentas não mudam.' },
        }), 'agent-team-profile-manager: alias dictionary');
        ctx.slots.inject(footer, () => ctx.slots.register({
          name: footer, id: 'agent-team-profile-aliases', order: 20, locale: namespace,
        }, AliasPanel));
      },
    };
  },
});

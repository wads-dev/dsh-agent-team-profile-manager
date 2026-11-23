/** DSH 0.2.3-alpha.2 Session panel section listing display aliases. Native catalog, navigation and transport stay upstream-owned. */
window.__ModuleLoader__.load({
  id: 'dsh-agent-team-profile-manager',
  factory: require => {
    const { createElement: h } = require('react');
    const section = 'conversation.session.panel.section';
    const namespace = 'agent-team-profile-aliases';
    const EMPTY = {};
    function AliasSection({ sessionId, useSessions, t }) {
      // Select the stable projection-values object; aliases are keyed by durable Session ID, never by name.
      const values = useSessions(state => state.projectionsBySession[sessionId]?.values ?? EMPTY);
      const aliases = values.agentTeamDisplayNames ?? EMPTY;
      const entries = (values.subagentCatalog ?? []).filter(entry => Object.hasOwn(aliases, entry.id));
      if (entries.length === 0) return null;
      return h('div', { 'data-agent-team-aliases': '', style: { fontSize: '12px' } },
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
          en: { title: 'Display aliases', help: 'Visual labels only. Use the Subagents section to navigate; tool targets are unchanged.' },
          pt: { title: 'Aliases visuais', help: 'Apenas rótulos visuais. Navegue pela seção Subagentes; os alvos das ferramentas não mudam.' },
        }), 'agent-team-profile-manager: alias dictionary');
        const t = ctx.locale.bind(namespace);
        ctx.slots.inject(section, () => ctx.slots.register({
          name: section,
          id: 'agent-team-profile-aliases',
          // After subagents (200), before shared tasks (250).
          order: 210,
          label: () => t('title'),
          locale: namespace,
        }, AliasSection));
      },
    };
  },
});

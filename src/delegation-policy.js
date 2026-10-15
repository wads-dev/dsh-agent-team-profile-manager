export const SUBAGENT_TOOLS = ['subagent', 'subagent_fork', 'list_subagent_models'];
export function installDelegationPolicy(agent, config) {
  const disposers = [];
  const blocked = config.disableSubagents !== false;
  if (blocked) {
    let releaseMask = () => {};
    let masked = '';
    const refresh = () => {
      const deny = SUBAGENT_TOOLS.filter(name => agent.ctx.root.tools.get(name));
      const signature = deny.join(',');
      if (signature === masked) return;
      masked = signature; // restrict emits tools/change synchronously.
      const previous = releaseMask;
      releaseMask = deny.length ? agent.ctx.tools.restrict({ deny }) : () => {};
      previous();
    };
    const stopWatching = agent.ctx.on('tools/change', refresh);
    disposers.push(() => { stopWatching(); releaseMask(); });
    refresh();
    // Scoped registrations are exempt from restrict(), so guard dispatch too.
    disposers.push(agent.ctx.tools.guard(exec => SUBAGENT_TOOLS.includes(exec.name)
      ? 'Standard sub-agent tools are disabled by the Team router. Use list_agents, spawn_teammate and send_message; ask the user which model to use first.' : undefined));
  }
  disposers.push(agent.ctx.systemPrompt.section({
    name: 'team-router:delegation-policy',
    order: agent.ctx.systemPrompt.getSectionOrder('TEAM_POLICY') + 1,
    text: [
      'The Team model router is active. For delegated work, use durable Agent Teams rather than standard subagent/subagent_fork tools. A request to delegate or use sub-agents authorizes Team-based delegation; do not create members without human authorization to delegate.',
      'Before delegating, ask the user which provider/model to use. They may choose one model for all members, a per-role mapping, or explicitly choose inheritance. Reuse their explicit choice for its stated scope; do not ask again for every task. Never invent consent or infer a choice from the currently running model.',
      'Use list_models to discover authorized routes and exact reasoning efforts. Only the Lead creates members via spawn_teammate with the chosen provider/model/reasoning_effort. If explicit inheritance was chosen, omit route fields. Teammates needing delegation must ask their Lead, not spawn nested sub-agents.',
      'Categorize members by reusable responsibility (implementation, review, research). Call list_agents before creating a member; reuse an appropriate existing member with send_message instead of recreating one per task. Preserve shared-task, write-scope and wait rules.',
      'Runtime model changes ARE supported for Team members: switch_model changes your own teammate route; switch_teammate_model lets the Lead change a live teammate. Changes apply at the next model invocation, not midway through an inference. Keep the same member/session. Use get_current_model to verify. set_teammate_display_name edits the UI label without changing the stable target.',
      blocked ? 'Standard sub-agent delegation and discovery tools are disabled in Team member scopes; the shared internal subagent runtime remains available to Agent Teams.' : 'Standard sub-agent tools are enabled only as an operator opt-out; prefer Teams and still obtain the user model choice before any delegation.',
    ].join('\n\n'),
  }));
  return () => { for (const dispose of disposers.reverse()) dispose(); };
}

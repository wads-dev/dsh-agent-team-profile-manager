/** Runtime switches use DSH's native durable model owner, never request hooks. */
export const same = (a, b) => !!a && !!b && a.provider === b.provider && a.model === b.model && a.reasoningEffort === b.reasoningEffort;
const wire = route => ({ provider: route?.provider ?? null, model: route?.model ?? null, reasoning_effort: route?.reasoningEffort ?? null });

export class ModelRouter {
  constructor(ctx) {
    this.ctx = ctx;
    this.locks = new Map();
  }

  info(agent) {
    const config = agent.session.requestHeader()?.config;
    const current = config ?? agent.options;
    const next = agent.model.current() ?? current;
    return { session: agent.id, current: wire(current), pending: same(current, next) ? null : wire(next), next: wire(next) };
  }

  /**
   * Match native subagent selection authority (DSH 0.2.3+): the live Host setting
   * authorizes exact routes for every Session; when it is disabled or absent, only
   * the caller's current route is allowed. Invalid enabled settings throw (fail closed).
   * Legacy per-Session `subagent/model-selection-policy` events are ignored, as upstream does.
   */
  allows(caller, route) {
    const allowed = this.ctx.get('subagentModelSelection')?.allowedRoutes();
    if (allowed !== undefined) return allowed.some(item => item.provider === route.provider && item.model === route.model);
    const fallback = caller.model.current() ?? caller.options;
    return route.provider === fallback.provider && route.model === fallback.model;
  }

  switch(caller, target, args, signal) {
    const previous = this.locks.get(target.id) ?? Promise.resolve();
    const operation = previous.then(async () => {
      signal.throwIfAborted();
      if (!args.provider || !args.model) throw new Error('Both provider and model are required');
      if (!this.allows(caller, args)) throw new Error('Requested route is not allowed for this Session');
      const route = {
        provider: args.provider,
        model: args.model,
        ...(args.reasoning_effort === undefined ? {} : { reasoningEffort: args.reasoning_effort }),
      };
      await this.ctx.llm.resolveModelInfo(route.provider, route.model, signal);
      // Preflight validation only: do not pin the adapter's default effort into the saved selection.
      await this.ctx.llm.resolveCallConfig(route, signal);
      signal.throwIfAborted();
      if (this.ctx.agents.get(caller.id) !== caller || this.ctx.agents.get(target.id) !== target || this.ctx.subagents.rootOf(target) !== this.ctx.subagents.rootOf(caller)) {
        throw new Error('Caller or target is no longer a live member of this tree');
      }
      const changed = !same(target.model.current(), route);
      if (changed) target.model.select(route);
      // Flush even on an idempotent retry after an earlier uncertain checkpoint.
      try { await this.ctx.sessions.flush(target.session); }
      catch (error) { throw new Error('Route committed in memory but durability checkpoint failed; inspect get_current_model before retrying', { cause: error }); }
      return { changed, ...this.info(target), effective: 'next-model-invocation' };
    });
    const tail = operation.catch(() => undefined);
    this.locks.set(target.id, tail);
    void tail.then(() => { if (this.locks.get(target.id) === tail) this.locks.delete(target.id); });
    return operation;
  }
}

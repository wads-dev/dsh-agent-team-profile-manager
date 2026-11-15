import { defineTool } from '@deepseek-ai/dsh-tools';
import { assertCompatibility } from './compatibility/dsh-0.2.2-rc.2.js';
import { displayNamesProjection, normalizeDisplayName } from './display-names/state.js';
import { infoSchema, switchSchema, listSchema, jsonOutput } from './tools/schemas.js';
import { ModelRouter } from './routing/model-router.js';
export const name = 'agent-team-profile-manager';
export const inject = ['agents', 'sessions', 'agentTeams', 'subagents', 'tools', 'llm', 'systemPrompt', 'sessionProjections'];
const routeFields = {
  provider: { type: 'string', required: true }, model: { type: 'string', required: true },
  reasoning_effort: { type: 'string' },
};
export async function apply(ctx) {
  assertCompatibility(ctx);
  const aliases = await ctx.sessionProjections.register(displayNamesProjection);
  const router = new ModelRouter(ctx);
  const installed = new Map();
  const rootFor = agent => ctx.subagents.rootOf(agent);
  const resolveTarget = async (caller, reference, signal) => {
    const root = rootFor(caller);
    if (root !== caller) throw new Error('Only the tree root can manage another agent');
    const id = await ctx.subagents.resolveName(caller, reference, signal);
    if (id === root.id) return { id, name: 'lead' };
    const rows = await ctx.subagents.listDescendants(root.id, signal);
    const row = rows.find(row => row.kind === 'child' && row.id === id && row.mode === 'continuable');
    if (!row) throw new Error('Target is not a reachable continuable agent in this tree');
    return { id, name: row.path ?? row.id };
  };
  const install = agent => {
    if (installed.has(agent)) return;
    const disposers = [];
    const register = (toolName, description, parameters, execute) => disposers.push(agent.ctx.tools.register(defineTool({ name: toolName, description, parameters, output: jsonOutput(toolName === 'list_models' ? listSchema : toolName === 'get_current_model' ? infoSchema : switchSchema), execute })));
    register('get_current_model', 'Read current, pending and next model route for this agent.', {}, async (_args, exec) => router.info(exec.agent));
    register('switch_model', 'Select this agent model for the next step; does not interrupt current inference.', routeFields, (args, exec) => router.switch(exec.agent, exec.agent, args, exec.signal));
    register('switch_teammate_model', 'Tree root only: switch a loaded descendant model at the next step. Target is a stable name from list_agents.', { teammate: {type:'string',required:true}, ...routeFields }, async (args, exec) => {
      const target = await resolveTarget(exec.agent, args.teammate, exec.signal);
      if (target.id === exec.agent.id) throw new Error('Use switch_model for the root agent');
      const live = ctx.agents.get(target.id);
      if (!live) throw new Error('Agent is unloaded; resume it before switching models');
      return router.switch(exec.agent, live, args, exec.signal);
    });
    disposers.push(agent.ctx.tools.register(defineTool({
      name:'set_teammate_display_name', isConcurrencySafe:()=>false,
      description:'Tree root only: record a durable display alias for a reachable agent. The complementary catalog footer shows aliases; native navigation labels and tool targets remain unchanged.',
      parameters:{target:{type:'string',required:true},display_name:{oneOf:[{type:'string'},{type:'null'}],required:true}},
      output:jsonOutput({type:'object',additionalProperties:false,properties:{target:{type:'string',required:true},session:{type:'string',required:true},display_name:{type:'string',required:true},changed:{type:'boolean',required:true},displayNames:{type:'json',required:true},aliasOperation:{type:'json',required:true}}}),
      async execute(args, exec) {
        const target = await resolveTarget(exec.agent, args.target, exec.signal);
        const state = aliases.stateOf(exec.agent.session);
        const names = {...state.names};
        const previous = names[target.id] ?? target.name;
        const displayName = args.display_name === null ? target.name : normalizeDisplayName(args.display_name);
        if (args.display_name === null) delete names[target.id]; else names[target.id]=displayName;
        exec.signal.throwIfAborted();
        return {target:target.name,session:target.id,display_name:displayName,changed:previous!==displayName,aliasOperation:{memberId:target.id,value:args.display_name===null?null:displayName},displayNames:{version:1,teamId:exec.agent.id,names}};
      },
    })));
    register('list_models', 'Discover Session-authorized live provider/model routes and adapter metadata. Catalogs are advisory; available means metadata resolution, not successful inference. An empty result is not permission to select other routes.', { provider: { type: 'string' }, model: { type: 'string' } }, async (args, exec) => {
      if (args.model !== undefined && args.provider === undefined) throw new Error('model requires provider');
      for (const key of ['provider', 'model']) if (args[key] !== undefined && args[key].length === 0) throw new Error(key + ' must be non-empty');
      exec.signal.throwIfAborted();
      const providers = ctx.llm.listProviders();
      const selected = args.provider === undefined ? providers : providers.filter(provider => provider.id === args.provider);
      if (args.provider !== undefined && !selected.length) throw new Error('Unknown provider "' + args.provider + '"');
      const routes = [];
      const catalogFailures = [];
      for (const provider of selected) {
        exec.signal.throwIfAborted();
        let models;
        if (args.model !== undefined) {
          models = [{ id: args.model }];
        } else {
          try { models = await ctx.llm.listModels(provider.id); }
          catch (error) {
            exec.signal.throwIfAborted();
            catalogFailures.push(provider.id + ': ' + String(error.message ?? error));
            continue;
          }
        }
        for (const model of models) {
          exec.signal.throwIfAborted();
          const route = { provider: provider.id, model: model.id };
          if (!router.allows(exec.agent, route)) continue;
          try { routes.push({ ...route, available: true, metadata: await ctx.llm.resolveModelInfo(provider.id, model.id, exec.signal) }); }
          catch (error) { exec.signal.throwIfAborted(); routes.push({ ...route, available: false, reason: String(error.message ?? error) }); }
        }
      }
      exec.signal.throwIfAborted();
      return { enabled: true, routes, ...(catalogFailures.length ? { message: 'Could not list models for ' + catalogFailures.join('; ') + '. Query an exact provider/model directly.' } : {}) };
    });
    installed.set(agent, () => { for(const dispose of disposers.reverse()) dispose(); });
  };
  ctx.on('agent/created', ({agent}) => install(agent));
  ctx.on('agent/disposed', ({agent}) => { installed.get(agent)?.(); installed.delete(agent); });
  ctx.effect(() => () => { for(const dispose of installed.values()) dispose(); installed.clear(); });
  for(const agent of ctx.agents.list()) install(agent);
}
